import * as React from 'react';
import { Button } from 'semantic-ui-react';
import { LauncherState } from './app';
import { LauncherConfig } from '../../common/launcher-config';
import { Injector, InjectionResult } from '../../common/injector';
import { ipcRenderer, shell } from 'electron';
import { Howl } from 'howler';
import * as fs from 'fs-extra';

const runas = require('runas');

export interface LauncherButtonProps {
    config: LauncherConfig;
    mainProcessArgv: string[];
    launcherState: LauncherState;
    userDataPath: string | null;
    onProcessStatusUpdate: (running: boolean) => void;
    onProcessLaunch: () => void;
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
        this.props.onProcessStatusUpdate(Injector.isProcessRunning(this.props.config.runningProcessName));
    }

    injectSafe = (): InjectionResult => {
        if (this.props.launcherState !== LauncherState.LAUNCHED) {
            return InjectionResult.UNKNOWN_ERROR;
        }

        // const soundStart = new Howl({src: './assets/sound/phaserifle.wav'});
        const soundEnd = new Howl({src: './assets/sound/blueplate.wav'});
        // soundStart.play();
        let args = this.props.mainProcessArgv.slice(1);
            args.push('--', '--inject',
                      '--process', this.props.config.runningProcessName,
                      '--dll', this.props.config.dllPath);
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
                if (this.props.config.launchViaSteam) {
                    shell.openExternal('steam://rungameid/17080');
                } else {
                    Injector.startProcess(this.props.config);
                }

                this.props.onProcessLaunch();

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