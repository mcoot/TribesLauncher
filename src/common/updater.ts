import * as fs from 'fs-extra';
const rmfr = require('rmfr');
import * as download from 'download';
import * as Registry from 'winreg';
import { lookupRegistry } from './regutils';
import { BrowserWindow } from 'electron';
import { homedir } from 'os';

const xml2js = require('xml2js');

enum RootLocation {
    LAUNCHER_DIRECTORY,
    CONFIG_DIRECTORY
}

type FileVersion = number;

class TAModsFile {
    public readonly root: RootLocation;
    public readonly path: string;
    public readonly version: FileVersion;

    public constructor(root: RootLocation, path: string, version: FileVersion) {
        this.root = root;
        this.path = path;
        this.version = version;
    }
}

class VersionManifest {
    public readonly channels: ReadonlyMap<string, ReadonlyArray<TAModsFile>>;

    public constructor(channels: ReadonlyMap<string, ReadonlyArray<TAModsFile>>) {
        this.channels = channels;
    }

    public toBeUpdated(channelName: string, remote: VersionManifest): TAModsFile[] {
        const thisChannel = this.channels.get(channelName);
        const remoteChannel = remote.channels.get(channelName);
        if (thisChannel == undefined || remoteChannel == undefined) {
            throw new Error(`Channel ${channelName} does not exist in version manifest`);
        }

        // Diff the two channels
        let result: Map<String, TAModsFile> = new Map();
        for (const file of thisChannel) {
            result.set(`${file.root}::${file.path}`, file);
        }

        // Compare the remote channel
        for (const file of remoteChannel) {
            const mapFname = `${file.root}::${file.path}`;
            if (!result.has(mapFname)) {
                // File missing from local, needs to be added
                result.set(mapFname, file);
            } else {
                // localFile cannot be null/undefined - hence ! assertion
                const localFile = result.get(mapFname)!;
                if (file.version > localFile.version) {
                    result.set(mapFname, file);
                } else {
                    // This file doesn't need updating
                    result.delete(mapFname);
                }
            }
        }

        return [...result.values()];
    }
}

export default class TAModsUpdater {

    public static readonly versionFile: string = 'version.xml';

    private static parseXmlPromise(parser: any, data: string): Promise<any> {
        return new Promise((res, rej) => {
            parser.parseString(data, (err: any, result: any) => {
                if (err) {
                    rej(err);
                } else {
                    res(result);
                }
            });
        });
    }

    private static async parseVersionManifest(data: string) {
        const rawXml = await this.parseXmlPromise(new xml2js.Parser(), data);

        if (!('TAMods' in rawXml)) {
            throw new Error('Missing root TAMods element in version manifest');
        }
        if (!('files' in rawXml.TAMods)) {
            throw new Error('No files list in version manifest');
        }

        let channels: Map<string, ReadonlyArray<TAModsFile>> = new Map();
        for (const channel of rawXml.TAMods.files) {
            const channelName = channel['$'].channel;
            let files: TAModsFile[] = [];
            for (const f of channel.file) {
                const version: FileVersion = parseFloat(f['$'].version);
                const fpathArr: string[] = f._.split(/[\/\\]/).slice();
                let froot: RootLocation;
                let fpath;
                if (f._.split(/[\/\\]/)[0] == '!CONFIG') {
                    froot = RootLocation.CONFIG_DIRECTORY;
                } else {
                    froot = RootLocation.LAUNCHER_DIRECTORY;
                }
                fpath = f._;
                files.push(new TAModsFile(froot, fpath, version));
            }
            channels.set(channelName, files);
        }
        return new VersionManifest(channels);
    }

    private static async parseVersionManifestFile(filename: string): Promise<VersionManifest> {
        const data = await fs.readFile(filename, 'utf8');
        return this.parseVersionManifest(data);
    }

    private static async getUpdateList(channel: string, localManifestFile: string, updateUrl: string): Promise<TAModsFile[]> {
        // Get the remote manifest
        const remoteManifestData = await download(`${updateUrl}/${TAModsUpdater.versionFile}`);
        const remoteManifest = await this.parseVersionManifest(remoteManifestData.toString('utf8'));

        if (!remoteManifest.channels.has(channel)) {
            throw new Error(`Release channel ${channel} does not exist in remote manifest`);
        }

        // Get the local manifest, if there is one
        if (fs.existsSync(localManifestFile)) {
            const localManifest = await this.parseVersionManifestFile(localManifestFile);

            if (!localManifest.channels.has(channel)) {
                // New channel, need full redownload
                return remoteManifest.channels.get(channel)!.slice();
            } else {
                return localManifest.toBeUpdated(channel, remoteManifest);
            }
        } else {
            // No local manifest, need full redownload
            return remoteManifest.channels.get(channel)!.slice();
        }
    }

    public static async isUpdateRequired(channel: string, baseDir: string, updateUrl: string): Promise<boolean> {
        if (!fs.existsSync(`${baseDir}/${this.versionFile}`)) {
            return true;
        } else {
            return (await this.getUpdateList(channel, `${baseDir}/${this.versionFile}`, updateUrl)).length > 0;
        }
    }

    private static async downloadFile(file: TAModsFile, baseDir: string, updateUrl: string, ipcWindow: BrowserWindow | null = null): Promise<void> {
        let localPathArr = file.path.split(/[\/\\]/);
        localPathArr.pop();
        const localPath = localPathArr.join('/');
        await download(`${updateUrl}/${file.path}`, `${baseDir}/${localPath}`);
        if (ipcWindow) {
            // Send a tick indicating a file has downloaded
            ipcWindow.webContents.send('update-tick', ['file-finished', file.path]);
        }
    }

    public static async getConfigDirectory(): Promise<string> {
        const regItem = await lookupRegistry(
            Registry.HKCU,
            '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders',
            'Personal');
        if (!regItem) {
            throw new Error('Could not retrieve user Documents directory from the registry');
        }

        if (regItem.value.includes('%USERPROFILE%')) {
            return `${homedir()}\\Documents\\My Games\\Tribes Ascend\\TribesGame\\config\\`;
        } else {
            return `${regItem.value}/my games/Tribes Ascend/TribesGame/config/`;
        }
    }

    public static async update(channel: string, baseDir: string,
                               downloadSync: boolean = false, updateUrl: string,
                               ipcWindow: BrowserWindow | null = null): Promise<void> {

        const updateList = await this.getUpdateList(channel, `${baseDir}/${this.versionFile}`, updateUrl);

        // Don't update if not required
        if (updateList.length == 0) {
            return;
        }

        // If sending event ticks, send the total number of files
        if (ipcWindow) {
            ipcWindow.webContents.send('update-tick', ['total-files', updateList.length]);
        }

        // Setup temporary download directory, clearing it out if files are already there\
        if ((await fs.pathExists(`${baseDir}/tmp`))) {
            await rmfr(`${baseDir}/tmp`);
        }
        await fs.mkdirp(`${baseDir}/tmp`);

        // Redownload the version manifest
        await download(`${updateUrl}/${this.versionFile}`, `${baseDir}/tmp`);

        if (downloadSync) {
            // Download in sequence
            for (const file of updateList) {
                await this.downloadFile(file, `${baseDir}/tmp`, updateUrl, ipcWindow);
            }
        } else {
            // Download asynchronously
            await Promise.all(updateList.map(f => this.downloadFile(f, `${baseDir}/tmp`, updateUrl, ipcWindow)));
        }

        const allFiles = await fs.readdir(`${baseDir}/tmp`);
        const configFiles = await fs.readdir(`${baseDir}/tmp/!CONFIG`);
        const nonConfigFiles = allFiles.filter(f => f !== '!CONFIG');

        // Move non-config files to the main directory
        await Promise.all(nonConfigFiles.map(f => fs.copy(`${baseDir}/tmp/${f}`, `${baseDir}/${f}`)));

        // Move config files to the appropriate directory
        const configDir = await this.getConfigDirectory();
        if (!(await fs.pathExists(configDir))) {
            await fs.mkdirp(configDir);
        }
        await Promise.all(configFiles.map(f => fs.copy(`${baseDir}/tmp/!CONFIG/${f}`, `${configDir}/${f}`)));

        // Delete temp dir
        await rmfr(`${baseDir}/tmp`);
    }

    public static async uninstall(channel: string, baseDir: string): Promise<boolean> {
        const configDir = await this.getConfigDirectory();

        if (!fs.existsSync(`${baseDir}/${this.versionFile}`)) {
            // Didn't uninstall because no version manifest found
            return false;
        }
        const localManifest = await this.parseVersionManifestFile(`${baseDir}/${this.versionFile}`);

        if (!localManifest.channels.get(channel)) {
            return false;
        }

        // Delete the version manifest
        fs.remove(`${baseDir}/${this.versionFile}`);

        // Delete all the files
        await Promise.all(localManifest.channels.get(channel)!.map(async (file) => {
            let filePath;
            if (file.root == RootLocation.CONFIG_DIRECTORY) {
                let localPathArr = file.path.split(/[\/\\]/);
                localPathArr.shift();
                const localPath = localPathArr.join('/');
                filePath = `${configDir}${localPath}`;
            } else {
                filePath = `${baseDir}/${file.path}`;
            }

            await fs.remove(filePath);
        }));

        return true;
    }

}