import * as React from 'react';
import { LauncherState } from './app';
import { LauncherConfig } from '../../common/launcher-config';
import { InjectionResult } from '../../common/injector';
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
export declare class LauncherButton extends React.Component<LauncherButtonProps, LauncherButtonState> {
    private pollTimer;
    constructor(props: LauncherButtonProps);
    componentDidMount(): void;
    componentWillUnmount(): void;
    pollProcessStatus: () => void;
    injectSafe: () => InjectionResult;
    onButtonClick: () => Promise<void>;
    render(): JSX.Element;
}
