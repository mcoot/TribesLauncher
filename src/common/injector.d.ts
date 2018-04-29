import { LauncherConfig } from './launcher-config';
export declare enum InjectionResult {
    SUCCESSFUL = 0,
    MISSING_ARGUMENTS = 1,
    PROCESS_NOT_RUNNING = 2,
    DLL_DOES_NOT_EXIST = 3,
    INSUFFICIENT_PRIVILEGE = 4,
    INJECTION_FAILED = 5,
    UNKNOWN_ERROR = 6,
}
export declare function injectionResultText(result: InjectionResult): "injection succeeded" | "required injection arguments not supplied" | "process is not running" | "could not find DLL file" | "injection requires administrator privileges" | "injection failed due to an unknown error" | "an unknown error occurred" | "";
export declare class Injector {
    private static generateExecutableArgs(config);
    static startProcess(config: LauncherConfig): void;
    static isProcessRunning(processName: string): boolean;
    static inject(processName: string, dllPath: string): Promise<InjectionResult>;
}
