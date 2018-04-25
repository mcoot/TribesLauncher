import * as React from 'react';
import { Grid, Progress } from 'semantic-ui-react';

import { LauncherConfig, generateDefaultConfig, loadLauncherConfig, saveLauncherConfigSync } from './launcher-config';
import { LauncherNews } from './launcher-news';
import { LauncherButton } from './components/launcherButton';
import { InjectionResult, injectionResultText } from './injector/injector';
import { ipcRenderer } from 'electron';
import { NewsDisplay } from './components/newsDisplay';
import { CommunityDisplay } from './components/communityDisplay'

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
  news: LauncherNews | null
}

export class App extends React.Component<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);
    console.log('getting...');
    this.state = {
      config: generateDefaultConfig(),
      launcherState: LauncherState.READY_TO_LAUNCH,
      progressbarTotal: 0,
      progressbarDone: 0,
      news: null
    }
    console.log('got...');
  }

  async componentDidMount() {
    window.addEventListener('beforeunload', this.componentCleanup);
    if (this.props.userDataPath) {
      // Load config
      const loadedConfig = await loadLauncherConfig(`${this.props.userDataPath}/launcherConfig.json`, this.props.userDataPath);
      this.setState((s) => ({
        config: loadedConfig,
        launcherState: s.launcherState,
        progressbarTotal: s.progressbarTotal,
        progressbarDone: s.progressbarDone,
        news: s.news
      }));

      ipcRenderer.on('update-check-finished-request', this.handleUpdateComplete);
      ipcRenderer.on('update-tick', this.handleUpdateTick);

      // Check for updates only if in Ready to Launch state
      if (this.state.launcherState == LauncherState.READY_TO_LAUNCH) {
        let installPath = '.';
        if (this.props.userDataPath) {
          installPath = this.props.userDataPath;
        }
        ipcRenderer.send('update-check-start-request', [this.state.config.releaseChannel, installPath, this.state.config.updateUrl]);
      }

      // Retrieve news
      ipcRenderer.on('news-retrieved', this.handleNewsRetrieved);
      ipcRenderer.send('news-request', `${this.state.config.updateUrl}/news.json`);
    }
  }

  componentCleanup = () => {
    if (this.props.userDataPath) {
      saveLauncherConfigSync(this.state.config, `${this.props.userDataPath}/launcherConfig.json`);
      ipcRenderer.removeAllListeners('update-check-finished-request');
      ipcRenderer.removeAllListeners('update-tick');
      ipcRenderer.removeAllListeners('news-retrieved');
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
        progressbarDone: 0,
        news: s.news
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
          progressbarDone: s.progressbarDone,
          news: s.news
        }));
        break;
      case 'file-finished':
        const fileName: string = args[1];
        this.setState((s) => ({
          config: s.config,
          launcherState: s.launcherState,
          progressbarTotal: s.progressbarTotal,
          progressbarDone: s.progressbarDone + 1,
          news: s.news
        }));
        break;
    }
  }

  handleNewsRetrieved = async (event: any, args: [boolean, any]) => {
    if (args[0] && args[1]) {
      this.setState((s) => ({
        config: s.config,
        launcherState: s.launcherState,
        progressbarDone: s.progressbarDone,
        progressbarTotal: s.progressbarTotal,
        news: args[1]
      }));
    }
  }

  onGameLaunch = (): void => {
    this.setState((s) => ({
      config: s.config,
      launcherState: LauncherState.LAUNCHED,
      progressbarTotal: s.progressbarTotal,
        progressbarDone: s.progressbarDone,
        news: s.news
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
            progressbarDone: s.progressbarDone,
            news: s.news
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
            progressbarDone: s.progressbarDone,
            news: s.news
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
        progressbarDone: s.progressbarDone,
        news: s.news
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
      progressbarDone: 0,
      news: s.news
    }));
  }

  onUpdateComplete = (): void => {
    this.setState((s) => ({
      config: s.config,
      launcherState: LauncherState.READY_TO_LAUNCH,
      progressbarTotal: s.progressbarTotal,
      progressbarDone: s.progressbarTotal,
      news: s.news
    }));
  }

  render() {
    // Progress bar progress
    const progressIsEnabled = (this.state.launcherState == LauncherState.UPDATING || this.state.launcherState == LauncherState.NEEDS_UPDATE);
    let currentProgress;
    let progressColor = "green";

    if (!progressIsEnabled) {
      currentProgress = 100;
    } else if (this.state.progressbarTotal <= 0) {
      currentProgress = 0;
    } else if (this.state.progressbarDone > this.state.progressbarTotal) {
      currentProgress = 100;
    } else {
      currentProgress = (this.state.progressbarDone / this.state.progressbarTotal) * 100;
    }

    return (
      <Grid>
        <Grid.Row columns={2}>
          <Grid.Column>
           <NewsDisplay news={this.state.news} />
          </Grid.Column>
          <Grid.Column>
           <CommunityDisplay news={this.state.news} />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={2}>
          <Grid.Column>
            <Progress precision={0} percent={currentProgress} color={"green"} progress={"percent"} disabled={!progressIsEnabled} autoSuccess />
          </Grid.Column>
          <Grid.Column>
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
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
}
