import * as fs from 'fs-extra';
import {Validator} from 'jsonschema';
const packageJson = require('../../package.json');

export const LAUNCHER_VERSION = packageJson.version;

const launcherConfigSchema = {
    'type': 'object',
    'additionalProperties': false,
    'properties': {
        'launchViaSteam': {
            'type': 'boolean'
        },
        'mainExecutablePath': {
            'type': 'string'
        },
        'customExecutableArgs': {
            'type': 'array',
            'items': {'type': 'string'}
        },
        'useDefaultExecutableArgs': {
            'type': 'boolean'
        },
        'runningProcessName': {
            'type': 'string'
        },
        'dllPath': {
            'type': 'string'
        },
        'configToolPath': {
            'type': 'string'
        },
        'masterServerHost': {
            'type': 'string'
        },
        'releaseChannel': {
            'type': 'string'
        },
        'updateUrl': {
            'type': 'string'
        }
    }
};

export interface LauncherConfig {
    launchViaSteam: boolean;
    // The path to the main executable
    mainExecutablePath: string;
    // Arguments to run the executable with
    customExecutableArgs: string[];
    // The name of the running process
    runningProcessName: string;
    // The path to the DLL
    dllPath: string;
    // The path to the external config tool
    configToolPath: string;

    useDefaultExecutableArgs: boolean;
    // The master / login server to use for T:A
    masterServerHost: string;

    releaseChannel: string;

    // Base URL to retrieve launcher updates from
    updateUrl: string;
}

export const generateDefaultConfig = (userDataPath: string = '.'): LauncherConfig => {
    return {
        launchViaSteam: true,
        mainExecutablePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Tribes\\Binaries\\Win32\\TribesAscend.exe',
        useDefaultExecutableArgs: true,
        customExecutableArgs: [],
        runningProcessName: 'TribesAscend.exe',
        dllPath: `${userDataPath}/tamods.dll`,
        configToolPath: `${userDataPath}/Config/TAModsConfigurationTool.exe`,
        masterServerHost: '45.33.99.115',
        releaseChannel: 'stable',
        updateUrl: 'https://raw.githubusercontent.com/mcoot/tamodsupdate/release'
    };
};

export const generateTestConfig = (executablePath: string, runningProcessName: string, dllPath: string): LauncherConfig => {
    let res = generateDefaultConfig();
    res.mainExecutablePath = executablePath;
    res.runningProcessName = runningProcessName;
    res.dllPath = dllPath;
    return res;
};

const loadLauncherConfigFromFile = async (filePath: string): Promise<LauncherConfig> => {
    const contents = await fs.readFile(filePath, 'utf8');
    // Parse config to JSON - may throw exception if config is invalid
    const launcherJson: LauncherConfig = JSON.parse(contents);

    // Validate against schema
    const validity = (new Validator()).validate(launcherJson, launcherConfigSchema);

    if (!validity.valid) {
        throw new Error(`Invalid launcher configuration: ${validity.errors}`);
    }

    return launcherJson;
};

export const loadLauncherConfig = async(filePath: string, userDataPath: string = '.'): Promise<LauncherConfig> => {
    let config = generateDefaultConfig(userDataPath);

    if (fs.existsSync(filePath)) {
        const loadedConfig = await loadLauncherConfigFromFile(filePath);
        for (const key in loadedConfig) {
            config[key] = loadedConfig[key];
        }
    }

    return config;
};

export const saveLauncherConfig = async (config: LauncherConfig, filePath: string): Promise<void> => {
    const contents = JSON.stringify(config, null, 4);
    await fs.writeFile(filePath, contents);
};

export const saveLauncherConfigSync = (config: LauncherConfig, filePath: string): void  => {
    const contents = JSON.stringify(config, null, 4);
    fs.writeFileSync(filePath, contents);
};