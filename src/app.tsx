import * as React from 'react';

import { LauncherConfig, generateDefaultConfig, loadLauncherConfig, saveLauncherConfigSync } from './launcher-config';
import { LauncherButton } from './components/launcherButton';
import { InjectionResult, injectionResultText } from './injector/injector';

const ProgressBar = require('react-progressbar.js');

export enum LauncherState {
  NEEDS_UPDATE,
  UPDATING,
  READY_TO_LAUNCH,
  LAUNCHED,
  INJECTED
};

export interface AppProps {
  launcherConfigPath: string | null;
  mainProcessArgv: string[];
}

export interface AppState {
  config: LauncherConfig;
  launcherState: LauncherState;
}

export class App extends React.Component<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);
    this.state = {
      config: generateDefaultConfig(),
      launcherState: LauncherState.READY_TO_LAUNCH
    }
  }

  async componentDidMount() {
    window.addEventListener('beforeunload', this.componentCleanup);
    if (this.props.launcherConfigPath) {
      const loadedConfig = await loadLauncherConfig(this.props.launcherConfigPath);
    this.setState((s) => ({
      config: loadedConfig,
      launcherState: s.launcherState
    }));
    }
  }

  componentCleanup = () => {
    if (this.props.launcherConfigPath) {
      saveLauncherConfigSync(this.state.config, this.props.launcherConfigPath);
    }
  }

  componentWillUnmount() {
    this.componentCleanup();
    window.removeEventListener('beforeunload', this.componentCleanup);
  }

  onGameLaunch = (): void => {
    this.setState((s) => ({
      config: s.config,
      launcherState: LauncherState.LAUNCHED
    }));
  }

  onProcessStatusUpdate = (running: boolean): void => {
    switch (this.state.launcherState) {
      case LauncherState.READY_TO_LAUNCH:
        if (running) {
          this.setState((s) => ({
            config: s.config,
            launcherState: LauncherState.LAUNCHED
          }));
        }
        break;
      case LauncherState.LAUNCHED:
      case LauncherState.INJECTED:
        if (!running) {
          this.setState((s) => ({
            config: s.config,
            launcherState: LauncherState.READY_TO_LAUNCH
          }));
        }
        break;
    }
  }

  onDLLInject = (result: InjectionResult): void => {
    if (result == InjectionResult.SUCCESSFUL) {
      this.setState((s) => ({
        config: s.config,
        launcherState: LauncherState.INJECTED
      }));
    } else {
      window.alert(`Injection failed with error message: ${injectionResultText(result)}.`);
    }
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

    return (
      <div>
        <div><h2>Tribes Launcher</h2></div>
        <div>
          <ProgressBar.Line 
              progress={1}
              initialAnimate={true}
              options={options}
          />
          <LauncherButton 
            config={this.state.config} 
            mainProcessArgv={this.props.mainProcessArgv}
            launcherState={this.state.launcherState}
            onProcessLaunch={this.onGameLaunch}
            onProcessStatusUpdate={this.onProcessStatusUpdate}
            onInject={this.onDLLInject}
          />
          </div>
      </div>
    );
  }
}
