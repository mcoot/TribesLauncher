export interface LauncherConfig {
    mainExecutablePath: string;
    customExecutableArgs: string[];
    runningProcessName: string;
    dllPath: string;
    useDefaultExecutableArgs: boolean;
    masterServerHost: string;
    releaseChannel: string;
    updateUrl: string;
}
export declare const generateDefaultConfig: (userDataPath?: string) => LauncherConfig;
export declare const generateTestConfig: (executablePath: string, runningProcessName: string, dllPath: string) => LauncherConfig;
export declare const loadLauncherConfig: (filePath: string, userDataPath?: string) => Promise<LauncherConfig>;
export declare const saveLauncherConfig: (config: LauncherConfig, filePath: string) => Promise<void>;
export declare const saveLauncherConfigSync: (config: LauncherConfig, filePath: string) => void;
