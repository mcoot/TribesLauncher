import * as injector from 'node-dll-injector';
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
const isAdmin = require('is-admin');

import { LauncherConfig } from './launcher-config';


export enum InjectionResult {
    SUCCESSFUL = 0,
    MISSING_ARGUMENTS,
    PROCESS_NOT_RUNNING,
    DLL_DOES_NOT_EXIST,
    INSUFFICIENT_PRIVILEGE,
    INJECTION_FAILED,
    UNKNOWN_ERROR
};

export function injectionResultText(result: InjectionResult) {
    switch (result) {
        case InjectionResult.SUCCESSFUL:
            return 'injection succeeded';
        case InjectionResult.MISSING_ARGUMENTS:
            return 'required injection arguments not supplied';
        case InjectionResult.PROCESS_NOT_RUNNING:
            return 'process is not running';
        case InjectionResult.DLL_DOES_NOT_EXIST:
            return 'could not find DLL file';
        case InjectionResult.INSUFFICIENT_PRIVILEGE:
            return 'injection requires administrator privileges';
        case InjectionResult.INJECTION_FAILED:
            return 'injection failed due to an unknown error';
        case InjectionResult.UNKNOWN_ERROR:
            return 'an unknown error occurred';
        default:
            return '';
    }
};

export class Injector {
    
    private static generateExecutableArgs(config: LauncherConfig) {
        let args: string[] = [];

        if (config.useDefaultExecutableArgs) {
            args.push(`-hostx=${config.masterServerHost}`);
        }

        if (config.customExecutableArgs.length > 0) {
            config.customExecutableArgs.forEach((arg) => args.push(arg));
        }

        return args;
    }

    public static startProcess(config: LauncherConfig): void {
        // Start the child properly detached
        // i.e. don't connect stdio, unref() to remove from node's reference counter
        const child = spawn(config.mainExecutablePath, this.generateExecutableArgs(config), {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
    }

    public static isProcessRunning(processName: string) {
        return injector.isProcessRunning(processName);
    }

    public static async inject(processName: string, dllPath: string): Promise<InjectionResult> {
        if (!this.isProcessRunning(processName)) {
            return InjectionResult.PROCESS_NOT_RUNNING;
        }

        if (!fs.existsSync(dllPath)) {
            return InjectionResult.DLL_DOES_NOT_EXIST;
        }

        const adminStatus = await isAdmin();
        if (adminStatus) {
            const success = injector.inject(processName, dllPath);
            if (success) {
                // Successful injection
                return InjectionResult.SUCCESSFUL;
            } else {
                return InjectionResult.INJECTION_FAILED;
            }
        } else {
            return InjectionResult.INSUFFICIENT_PRIVILEGE;
        }
    }
}