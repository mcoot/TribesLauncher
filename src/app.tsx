import * as React from 'react';

import { LauncherConfig, generateDefaultConfig, loadLauncherConfig, saveLauncherConfigSync } from './launcher-config';
import { LauncherButton } from './components/launcherButton';
import { InjectionResult, injectionResultText } from './injector/injector';
import { ipcRenderer } from 'electron';

const ProgressBar = require('react-progressbar.js');

export enum LauncherState {
  NEEDS_UPDATE,
  UPDATING,
  READY_TO_LAUNCH,
  LAUNCHED,
  INJECTED
};

export interface AppProps {
  userDataPath: string | null;
  mainProcessArgv: string[];
}

export interface AppState {
  config: LauncherConfig;
  launcherState: LauncherState;
  progressbarTotal: number;
  progressbarDone: number;
}

export class App extends React.Component<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);
    this.state = {
      config: generateDefaultConfig(),
      launcherState: LauncherState.READY_TO_LAUNCH,
      progressbarTotal: 0,
      progressbarDone: 0
    }
  }

  async componentDidMount() {
    window.addEventListener('beforeunload', this.componentCleanup);
    if (this.props.userDataPath) {
      const loadedConfig = await loadLauncherConfig(`${this.props.userDataPath}/launcherConfig.json`, this.props.userDataPath);
      this.setState((s) => ({
        config: loadedConfig,
        launcherState: s.launcherState,
        progressbarTotal: s.progressbarTotal,
        progressbarDone: s.progressbarDone
      }));

      ipcRenderer.on('update-check-finished-request', this.handleUpdateComplete);
      ipcRenderer.on('update-tick', this.handleUpdateTick);

      // Check for updates only if in Ready to Launch state
      if (this.state.launcherState == LauncherState.READY_TO_LAUNCH) {
        let installPath = '.';
        if (this.props.userDataPath) {
          installPath = this.props.userDataPath;
        }
        ipcRenderer.send('update-check-start-request', [this.state.config.releaseChannel, installPath]);
      }
    }
  }

  componentCleanup = () => {
    if (this.props.userDataPath) {
      saveLauncherConfigSync(this.state.config, `${this.props.userDataPath}/launcherConfig.json`);
      ipcRenderer.removeAllListeners('update-check-finished-request');
      ipcRenderer.removeAllListeners('update-tick');
    }
  }

  componentWillUnmount() {
    this.componentCleanup();
    window.removeEventListener('beforeunload', this.componentCleanup);
  }

  handleUpdateComplete = async (event: any, result: boolean) => {
    if (result) {
      this.setState((s) => ({
        config: s.config,
        launcherState: LauncherState.NEEDS_UPDATE,
        progressbarTotal: 0,
        progressbarDone: 0
      }));
    }
  }

  handleUpdateTick = async (event: any, args: any[]) => {
    const msgKind: string = args[0];

    switch (msgKind) {
      case 'total-files':
        const totalFiles: number = args[1];
        this.setState((s) => ({
          config: s.config,
          launcherState: s.launcherState,
          progressbarTotal: totalFiles,
          progressbarDone: s.progressbarDone
        }));
        break;
      case 'file-finished':
        const fileName: string = args[1];
        this.setState((s) => ({
          config: s.config,
          launcherState: s.launcherState,
          progressbarTotal: s.progressbarTotal,
          progressbarDone: s.progressbarDone + 1
        }));
        break;
    }
  }

  onGameLaunch = (): void => {
    this.setState((s) => ({
      config: s.config,
      launcherState: LauncherState.LAUNCHED,
      progressbarTotal: s.progressbarTotal,
        progressbarDone: s.progressbarDone
    }));
  }

  onProcessStatusUpdate = (running: boolean): void => {
    switch (this.state.launcherState) {
      case LauncherState.READY_TO_LAUNCH:
        if (running) {
          this.setState((s) => ({
            config: s.config,
            launcherState: LauncherState.LAUNCHED,
            progressbarTotal: s.progressbarTotal,
              progressbarDone: s.progressbarDone
          }));
        }
        break;
      case LauncherState.LAUNCHED:
      case LauncherState.INJECTED:
        if (!running) {
          this.setState((s) => ({
            config: s.config,
            launcherState: LauncherState.READY_TO_LAUNCH,
            progressbarTotal: s.progressbarTotal,
            progressbarDone: s.progressbarDone
          }));
        }
        break;
    }
  }

  onDLLInject = (result: InjectionResult): void => {
    if (result == InjectionResult.SUCCESSFUL) {
      this.setState((s) => ({
        config: s.config,
        launcherState: LauncherState.INJECTED,
        progressbarTotal: s.progressbarTotal,
        progressbarDone: s.progressbarDone
      }));
    } else {
      window.alert(`Injection failed with error message: ${injectionResultText(result)}.`);
    }
  }

  onUpdateStart = (): void => {
    this.setState((s) => ({
      config: s.config,
      launcherState: LauncherState.UPDATING,
      progressbarTotal: 0,
      progressbarDone: 0
    }));
  }

  onUpdateComplete = (): void => {
    this.setState((s) => ({
      config: s.config,
      launcherState: LauncherState.READY_TO_LAUNCH,
      progressbarTotal: s.progressbarTotal,
      progressbarDone: s.progressbarTotal
    }));
  }

  render() {
    const containerStyle = {
      width: '200px',
      height: '200px'
    };

    const options = {
      strokeWidth: 2,
      color: '#00FF00',
      text: {
        value: 'beanios',
        style: {
          color: '#000000'
        }
      }
    };

    let currentProgress;
    if (this.state.progressbarTotal == 0) {
      currentProgress = 0;
    } else if (this.state.progressbarDone > this.state.progressbarTotal) {
      currentProgress = 1;
    } else {
      currentProgress = this.state.progressbarDone / this.state.progressbarTotal;
    }

    return (
      <div>
        <div><h2>Tribes Launcher</h2></div>
        <div>
          <ProgressBar.Line
              progress={currentProgress}
              initialAnimate={true}
              options={options}
          />
          <LauncherButton 
            config={this.state.config} 
            mainProcessArgv={this.props.mainProcessArgv}
            launcherState={this.state.launcherState}
            userDataPath={this.props.userDataPath}
            onProcessLaunch={this.onGameLaunch}
            onProcessStatusUpdate={this.onProcessStatusUpdate}
            onUpdateStart={this.onUpdateStart}
            onUpdateComplete={this.onUpdateComplete}
            onInject={this.onDLLInject}
          />
          </div>
      </div>
    );
  }
}
