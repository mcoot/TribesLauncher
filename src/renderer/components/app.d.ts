import * as React from 'react';
import { LauncherConfig } from '../../common/launcher-config';
import { LauncherNews } from '../../common/launcher-news';
import { InjectionResult } from '../../common/injector';
export declare enum LauncherState {
    NEEDS_UPDATE = 0,
    UPDATING = 1,
    READY_TO_LAUNCH = 2,
    LAUNCHED = 3,
    INJECTED = 4,
}
export interface AppProps {
    userDataPath: string | null;
    mainProcessArgv: string[];
}
export interface AppState {
    config: LauncherConfig;
    launcherState: LauncherState;
    progressbarTotal: number;
    progressbarDone: number;
    news: LauncherNews | null;
}
export declare class App extends React.Component<AppProps, AppState> {
    constructor(props: AppProps);
    componentDidMount(): Promise<void>;
    componentCleanup: () => void;
    componentWillUnmount(): void;
    handleUpdateComplete: (_: any, result: boolean) => Promise<void>;
    handleUpdateTick: (_: any, args: any[]) => Promise<void>;
    handleNewsRetrieved: (_: any, args: [boolean, any]) => Promise<void>;
    onGameLaunch: () => void;
    onProcessStatusUpdate: (running: boolean) => void;
    onDLLInject: (result: InjectionResult) => void;
    onUpdateStart: () => void;
    onUpdateComplete: () => void;
    render(): JSX.Element;
}
