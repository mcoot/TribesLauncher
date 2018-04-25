import * as React from 'react';
import { Button } from 'semantic-ui-react';
import { LauncherState } from '../app';
import { LauncherConfig } from '../launcher-config';
import { Injector, InjectionResult } from '../injector/injector';
import { ipcRenderer } from 'electron';
import TAModsUpdater from '../updater/updater';
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
};

export interface LauncherButtonState {
};

export class LauncherButton extends React.Component<LauncherButtonProps, LauncherButtonState> {

    private pollTimer: NodeJS.Timer;

    constructor(props: LauncherButtonProps) {
        super(props);
    }

    componentDidMount() {
        this.pollTimer = setInterval(this.pollProcessStatus, 1000);

        ipcRenderer.on('update-finished-request', (event: string) => {
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
        let args = this.props.mainProcessArgv.slice(1);
            args.push('--', '--inject',
                      '--process', this.props.config.runningProcessName, 
                      '--dll', this.props.config.dllPath);
            return runas(this.props.mainProcessArgv[0], args, {
                admin: true,
                hide: true
            });
    }

    onButtonClick = async () => {
        switch (this.props.launcherState) {
            case LauncherState.LAUNCHED:
                this.props.onInject(this.injectSafe());
                break;
            case LauncherState.INJECTED:
                break;
            case LauncherState.READY_TO_LAUNCH:
                Injector.startProcess(this.props.config);
                this.props.onProcessLaunch();
                break;
            case LauncherState.NEEDS_UPDATE:
                let installPath = this.props.userDataPath;
                if (!this.props.userDataPath) {
                    installPath = '.';
                }
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
                buttonText = 'Inject TAMods';
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
            <Button onClick={this.onButtonClick} disabled={isDisabled}>{buttonText}</Button>
        );
    }

}