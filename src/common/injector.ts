import * as injector from 'node-dll-injector';
import { spawn } from 'child_process';
import { shell } from 'electron';
import * as Registry from 'winreg';
import { lookupRegistry } from './regutils';
import * as fs from 'fs-extra';
const isAdmin = require('is-admin');

import { LauncherConfig, MasterServerMode } from './launcher-config';
import { LauncherNews } from './launcher-news';

export enum InjectionResult {
    SUCCESSFUL = 0,
    PROCESS_NOT_OPEN = 1,
    FAILED_TO_GET_DLL_PATH_NAME = 2,
    PATH_NAME_BUFFER_TOO_SMALL = 3,
    FAILED_TO_ALLOCATE_DLL_NAME_MEMORY = 4,
    FAILED_TO_WRITE_DLL_NAME_MEMORY = 5,
    FAILED_TO_CREATE_REMOTE_THREAD = 6,
    PROCESS_NOT_RUNNING = 7,
    WRONG_NUMBER_OF_ARGUMENTS = 8,
    WRONG_ARGUMENT_TYPES = 9,
    FAILED_TO_READ_DLL_NAME_ARG = 10,
    DLL_DOES_NOT_EXIST = 11,
    INSUFFICIENT_PRIVILEGE = 12,
    UNKNOWN_ERROR = 13
}

export function injectionResultText(result: InjectionResult) {
    switch (result) {
        case InjectionResult.SUCCESSFUL:
            return 'injection succeeded';
        case InjectionResult.PROCESS_NOT_OPEN:
            return 'process handle not open';
        case InjectionResult.FAILED_TO_GET_DLL_PATH_NAME:
            return 'failed to generate DLL path name';
        case InjectionResult.PATH_NAME_BUFFER_TOO_SMALL:
            return 'failed to generate DLL path name; path name too long';
        case InjectionResult.FAILED_TO_ALLOCATE_DLL_NAME_MEMORY:
            return 'failed to allocate memory for injection';
        case InjectionResult.FAILED_TO_WRITE_DLL_NAME_MEMORY:
            return 'failed to write to memory for injection';
        case InjectionResult.FAILED_TO_CREATE_REMOTE_THREAD:
            return 'failed to create remote thread';
        case InjectionResult.PROCESS_NOT_RUNNING:
            return 'process not found';
        case InjectionResult.WRONG_NUMBER_OF_ARGUMENTS:
            return 'wrong number of arguments for injection';
        case InjectionResult.WRONG_ARGUMENT_TYPES:
            return 'wrong types for injection arguments';
        case InjectionResult.FAILED_TO_READ_DLL_NAME_ARG:
            return 'failed to read DLL path as string';
        case InjectionResult.FAILED_TO_READ_DLL_NAME_ARG:
            return 'DLL does not exist';
        case InjectionResult.FAILED_TO_READ_DLL_NAME_ARG:
            return 'insufficient privilege; injection must be performed as admin';
        case InjectionResult.UNKNOWN_ERROR:
            return 'an unknown error occurred';
        default:
            return 'unknown';
    }
}

export class Injector {
    private static generateExecutableArgs(news: LauncherNews | null, config: LauncherConfig) {
        let args: string[] = [];

        if (config.useDefaultExecutableArgs) {
            let loginHost: string = config.masterServerHost;
            if (news) {
                switch (config.masterServerMode) {
                    case MasterServerMode.HIREZ:
                    loginHost = news.masterServers.hirezMasterServerHost;
                    break;
                    case MasterServerMode.UNOFFICIAL:
                    loginHost = news.masterServers.unofficialMasterServerHost;
                    break;
                }
            }

            args.push(`-hostx=${loginHost}`);
        }

        if (config.launchWithGOTYFlag) {
            args.push('-goty');
        }

        if (config.customExecutableArgs.length > 0) {
            config.customExecutableArgs.forEach((arg) => args.push(arg));
        }

        return args;
    }

    private static async lookupSteamExePath(): Promise<string | null> {
        const regItem = await lookupRegistry(
            Registry.HKCU,
            '\\Software\\Valve\\Steam',
            'SteamExe');
        if (!regItem) {
            return null;
        }
        return regItem.value;
    }

    public static async startProcessSteam(news: LauncherNews | null, config: LauncherConfig): Promise<string | null> {
        const args = this.generateExecutableArgs(news, config);
        const steamExe = await this.lookupSteamExePath();

        if (steamExe) {
            // Launch via steam directly (won't show warning prompt for custom args)
            const child = spawn(steamExe, [
                '-applaunch',
                '17080',
                ...args
            ], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
            return config.runningProcessName;
        } else {
            // Launch using Steam URL. Will show warning prompt for custom args
            // DISABLED
            // shell.openExternal(`steam://rungameid/17080//${args}`);
            return null;
        }
    }

    public static startProcess(news: LauncherNews | null, config: LauncherConfig): number {
        // Start the child properly detached
        // i.e. don't connect stdio, unref() to remove from node's reference counter
        const child = spawn(config.mainExecutablePath, this.generateExecutableArgs(news, config), {
            detached: true,
            stdio: 'ignore'
        });
        const pid = child.pid;
        child.unref();

        return pid;
    }

    public static isProcessRunningByName(process: string) {
        return injector.isProcessRunning(process);
    }

    public static isProcessRunningByPID(pid: number) {
        return injector.isProcessRunningPID(pid);
    }

    public static async injectByName(process: string, dllPath: string): Promise<InjectionResult> {
        if (!this.isProcessRunningByName(process)) {
            return InjectionResult.PROCESS_NOT_RUNNING;
        }

        if (!fs.existsSync(dllPath)) {
            return InjectionResult.DLL_DOES_NOT_EXIST;
        }

        const adminStatus = await isAdmin();
        if (adminStatus) {
            return injector.inject(process, dllPath);
        } else {
            return InjectionResult.INSUFFICIENT_PRIVILEGE;
        }
    }

    public static async injectByPID(pid: number, dllPath: string): Promise<InjectionResult> {
        if (!this.isProcessRunningByPID(pid)) {
            return InjectionResult.PROCESS_NOT_RUNNING;
        }

        if (!fs.existsSync(dllPath)) {
            return InjectionResult.DLL_DOES_NOT_EXIST;
        }

        const adminStatus = await isAdmin();
        if (adminStatus) {
            return injector.injectPID(pid, dllPath);
        } else {
            return InjectionResult.INSUFFICIENT_PRIVILEGE;
        }
    }
}