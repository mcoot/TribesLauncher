import * as fs from 'fs-extra';
import * as download from 'download';

const xml2js = require('xml2js');

enum RootLocation {
    LAUNCHER_DIRECTORY,
    CONFIG_DIRECTORY
};

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

    private static readonly versionFile: string = 'version.xml';
    private static readonly baseUrl: string = 'https://raw.githubusercontent.com/josephspearritt/tamodsupdate/release';

    private static parseXmlPromise(parser: any, data: string): Promise<any> {
        return new Promise((res, rej) => {
            parser.parseString(data, (err: any, result: any) => {
                if (err) {
                    rej(err);
                }
                res(result);
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
                    fpath = f._.split(/[\/\\]/).slice();
                } else {
                    froot = RootLocation.LAUNCHER_DIRECTORY;
                    fpath = f._;
                }
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

    private static async getUpdateList(channel: string): Promise<TAModsFile[]> {
        // Get the remote manifest
        const remoteManifestData = await download(`${TAModsUpdater.baseUrl}/${TAModsUpdater.versionFile}`);
        const remoteManifest = await this.parseVersionManifest(remoteManifestData.toString('utf8'));

        if (!remoteManifest.channels.has(channel)) {
            throw new Error(`Release channel ${channel} does not exist in remote manifest`);
        }

        // Get the local manifest, if there is one
        if (fs.existsSync(TAModsUpdater.versionFile)) {
            const localManifest = await this.parseVersionManifestFile('version.xml');

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

    public static async isUpdateRequired(channel: string): Promise<boolean> {
        if (!fs.existsSync(TAModsUpdater.versionFile)) {
            return true;
        } else {
            return (await this.getUpdateList(channel)).length > 0;
        }
    }

    public static async update(channel: string): Promise<void> {
        const updateList = await this.getUpdateList(channel);

        // Don't update if not required
        if (updateList.length == 0) {
            return;
        }

        // Setup temporary download directory, clearing it out if files are already there
        await fs.mkdirp('./tmp');
        const tmpContents = await fs.readdir('./tmp');
        await Promise.all(tmpContents.map(f => fs.unlink(`./tmp/${f}`)));

        // Redownload the version manifest
        await download(`${this.baseUrl}/${this.versionFile}`, `./tmp/${this.versionFile}`);

        // Download new and updated files (in order, not in parallel)
        for (const file of updateList) {
            console.log(`Downloading ${file.path}...`)
            if (file.root == RootLocation.CONFIG_DIRECTORY) {
                await download(`${this.baseUrl}/!CONFIG/${file.path}`, `./tmp/!CONFIG/${file.path}`);
            } else {
                await download(`${this.baseUrl}/${this.versionFile}`, `./tmp/${file.path}`);
            }
        }
    }

}