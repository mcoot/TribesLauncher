import * as React from 'react';
import { LauncherState } from '../app';
import { LauncherConfig } from '../launcher-config';
import { Injector, InjectionResult } from '../injector/injector';
const runas = require('runas');

export interface LauncherButtonProps {
    config: LauncherConfig;
    mainProcessArgv: string[];
    launcherState: LauncherState;
    onProcessStatusUpdate: (running: boolean) => void;
    onProcessLaunch: () => void;
    onInject: (result: InjectionResult) => void;
};

export interface LauncherButtonState {
};

export class LauncherButton extends React.Component<LauncherButtonProps, LauncherButtonState> {

    private pollTimer: NodeJS.Timer;

    constructor(props: LauncherButtonProps) {
        super(props);
        this.state = {
            currentlyRunning: false,
            currentlyInjected: false
        };
    }

    componentDidMount() {
        this.pollTimer = setInterval(this.pollProcessStatus, 1000);
    }

    componentWillUnmount() {
        clearInterval(this.pollTimer);
    }

    pollProcessStatus = () => {
        this.props.onProcessStatusUpdate(Injector.isProcessRunning(this.props.config.runningProcessName));
    }

    injectSafe = async (): Promise<InjectionResult> => {
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
                this.props.onInject(await this.injectSafe());
                break;
            case LauncherState.INJECTED:
                break;
            case LauncherState.READY_TO_LAUNCH:
                Injector.startProcess(this.props.config);
                this.props.onProcessLaunch();
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
            default:
                break;
        }

        return (
            <button onClick={this.onButtonClick} disabled={isDisabled}>{buttonText}</button>
        );
    }

}