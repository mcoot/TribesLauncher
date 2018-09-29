import * as React from 'react';
import { Button } from 'semantic-ui-react';
import { LauncherState } from './app';
import { LauncherConfig } from '../../common/launcher-config';
import { Injector, InjectionResult } from '../../common/injector';
import { ipcRenderer } from 'electron';
import { Howl } from 'howler';
import * as fs from 'fs-extra';
import { LauncherNews } from '../../common/launcher-news';

const runas = require('runas');

export interface LauncherButtonProps {
    news: LauncherNews | null;
    config: LauncherConfig;
    mainProcessArgv: string[];
    launcherState: LauncherState;
    runningReference: number | string | null;
    userDataPath: string | null;
    onProcessStatusUpdate: (running: boolean) => void;
    onProcessLaunch: (reference: number | string) => void;
    onInject: (result: InjectionResult) => void;
    onUpdateStart: () => void;
    onUpdateComplete: () => void;
}

export interface LauncherButtonState {
}

export class LauncherButton extends React.Component<LauncherButtonProps, LauncherButtonState> {

    private pollTimer: NodeJS.Timer;

    constructor(props: LauncherButtonProps) {
        super(props);
    }

    componentDidMount() {
        this.pollTimer = setInterval(this.pollProcessStatus, 1000);

        ipcRenderer.on('update-finished-request', (_: string) => {
            this.props.onUpdateComplete();
        });
    }

    componentWillUnmount() {
        clearInterval(this.pollTimer);

        ipcRenderer.removeAllListeners('update-finished-request');
    }

    pollProcessStatus = () => {
        if (this.props.runningReference) {
            let isRunning;
            if (typeof this.props.runningReference === 'number') {
                isRunning = Injector.isProcessRunningByPID(this.props.runningReference);
            } else {
                isRunning = Injector.isProcessRunningByName(this.props.runningReference);
            }
            console.log(`Polled for process ${this.props.runningReference}, it is ${isRunning ? 'running' : 'not running'}`);
            this.props.onProcessStatusUpdate(isRunning);
        }
    }

    injectSafe = (): InjectionResult => {
        if (this.props.runningReference === null) {
            return InjectionResult.PROCESS_NOT_RUNNING;
        }

        // const soundStart = new Howl({src: './assets/sound/phaserifle.wav'});
        const soundEnd = new Howl({src: './assets/sound/blueplate.wav'});
        // soundStart.play();
        let args = this.props.mainProcessArgv.slice(1);
        args.push('--', '--inject', '--dll', this.props.config.dllPath);
        if (typeof this.props.runningReference === 'number') {
            args.push('--pid', this.props.runningReference.toString());
        } else {
            args.push('--processname', this.props.runningReference);
        }
        const result: InjectionResult = runas(this.props.mainProcessArgv[0], args, {
            admin: true,
            hide: true
        });
        if (result == InjectionResult.SUCCESSFUL) {
            soundEnd.play();
        }
        return result;
    }

    onButtonClick = async () => {
        switch (this.props.launcherState) {
            case LauncherState.LAUNCHED:
                if (this.props.config.autoInjectEnabled) {
                    break;
                }
                this.props.onInject(this.injectSafe());
                break;
            case LauncherState.INJECTED:
                break;
            case LauncherState.READY_TO_LAUNCH:
                let res: number | string | null;
                if (this.props.config.launchViaSteam) {
                    res = await Injector.startProcessSteam(this.props.news, this.props.config);
                    // console.log(`Process started: ${res}`);
                } else {
                    res = Injector.startProcess(this.props.news, this.props.config);
                }

                if (res === null) {
                    // Failed to start
                    return;
                }

                this.props.onProcessLaunch(res);

                if (this.props.config.autoInjectEnabled) {
                    // Auto-injection
                    setTimeout(() => this.props.onInject(this.injectSafe()), (this.props.config.autoInjectTimer) * 1000);
                }
                break;
            case LauncherState.NEEDS_UPDATE:
                const installPath = this.props.userDataPath || '.';
                this.props.onUpdateStart();
                ipcRenderer.send('update-start-request', [this.props.config.releaseChannel, installPath, this.props.config.updateUrl]);
                break;
        }
    }

    render() {
        let buttonText;
        let isDisabled = false;
        switch (this.props.launcherState) {
            case LauncherState.LAUNCHED:
                if (this.props.config.autoInjectEnabled) {
                    buttonText = 'Auto-injecting...';
                    isDisabled = true;
                } else {
                    buttonText = 'Inject TAMods';
                }
                break;
            case LauncherState.INJECTED:
                buttonText = 'Injected!';
                isDisabled = true;
                break;
            case LauncherState.READY_TO_LAUNCH:
                buttonText = 'Launch Tribes';
                break;
            case LauncherState.NEEDS_UPDATE:
                buttonText = 'Update TAMods';
                break;
            case LauncherState.UPDATING:
                buttonText = 'Updating...';
                isDisabled = true;
                break;
            default:
                break;
        }

        return (
            <div className={'launcherButtonInnerDiv'}>
                <Button fluid primary onClick={this.onButtonClick} disabled={isDisabled}>{buttonText}</Button>
            </div>
        );
    }

}