import * as React from 'react';
import { Progress, Button, Icon } from 'semantic-ui-react';

import { LauncherConfig, generateDefaultConfig, loadLauncherConfig, saveLauncherConfigSync } from '../../common/launcher-config';
import { LauncherNews } from '../../common/launcher-news';
import { LauncherButton } from './launcherButton';
import { InjectionResult, injectionResultText } from '../../common/injector';
import { ipcRenderer, remote } from 'electron';
import { NewsDisplay } from './newsDisplay';
import { CommunityDisplay } from './communityDisplay';
import { InfoModal } from './infoModal';
import { SettingsModal } from './settingsModal';

export enum LauncherState {
  NEEDS_UPDATE,
  UPDATING,
  READY_TO_LAUNCH,
  LAUNCHED,
  INJECTED
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
  backgroundImage: string;
}

export class App extends React.Component<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);

    const bgArr = ['arx-1', 'arx-2', 'arx-3', 'kata-1', 'kata-2', 'terminus-1'];
    const bgIndex = Math.floor(Math.random() * bgArr.length);

    this.state = {
      config: generateDefaultConfig(),
      launcherState: LauncherState.READY_TO_LAUNCH,
      progressbarTotal: 0,
      progressbarDone: 0,
      news: null,
      backgroundImage: bgArr[bgIndex]
    };
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
        news: s.news,
        backgroundImage: s.backgroundImage
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

  handleUpdateComplete = async (_: any, result: boolean) => {
    if (result) {
      this.setState((s) => ({
        config: s.config,
        launcherState: LauncherState.NEEDS_UPDATE,
        progressbarTotal: 0,
        progressbarDone: 0,
        news: s.news,
        backgroundImage: s.backgroundImage
      }));
    }
  }

  handleUpdateTick = async (_: any, args: any[]) => {
    const msgKind: string = args[0];

    switch (msgKind) {
      case 'total-files':
        const totalFiles: number = args[1];
        this.setState((s) => ({
          config: s.config,
          launcherState: s.launcherState,
          progressbarTotal: totalFiles,
          progressbarDone: s.progressbarDone,
          news: s.news,
          backgroundImage: s.backgroundImage
        }));
        break;
      case 'file-finished':
        // const fileName: string = args[1];
        this.setState((s) => ({
          config: s.config,
          launcherState: s.launcherState,
          progressbarTotal: s.progressbarTotal,
          progressbarDone: s.progressbarDone + 1,
          news: s.news,
          backgroundImage: s.backgroundImage
        }));
        break;
    }
  }

  handleNewsRetrieved = async (_: any, args: [boolean, any]) => {
    if (args[0] && args[1]) {
      this.setState((s) => ({
        config: s.config,
        launcherState: s.launcherState,
        progressbarDone: s.progressbarDone,
        progressbarTotal: s.progressbarTotal,
        news: args[1],
        backgroundImage: s.backgroundImage
      }));
    }
  }

  onGameLaunch = (): void => {
    this.setState((s) => ({
      config: s.config,
      launcherState: LauncherState.LAUNCHED,
      progressbarTotal: s.progressbarTotal,
        progressbarDone: s.progressbarDone,
        news: s.news,
        backgroundImage: s.backgroundImage
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
            news: s.news,
            backgroundImage: s.backgroundImage
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
            news: s.news,
            backgroundImage: s.backgroundImage
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
        news: s.news,
        backgroundImage: s.backgroundImage
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
      news: s.news,
      backgroundImage: s.backgroundImage
    }));
  }

  onUpdateComplete = (): void => {
    this.setState((s) => ({
      config: s.config,
      launcherState: LauncherState.READY_TO_LAUNCH,
      progressbarTotal: s.progressbarTotal,
      progressbarDone: s.progressbarTotal,
      news: s.news,
      backgroundImage: s.backgroundImage
    }));
  }

  onBtnMinimisePressed = () => {
    remote.BrowserWindow.getFocusedWindow().minimize();
  }

  onBtnQuitPressed = () => {
    remote.app.quit();
  }

  onSettingsFormSave = (updatedConfig: LauncherConfig): void => {
    this.setState((s) => ({
      config: updatedConfig,
      launcherState: s.launcherState,
      progressbarTotal: s.progressbarTotal,
      progressbarDone: s.progressbarTotal,
      news: s.news,
      backgroundImage: s.backgroundImage
    }));
  }

  render() {
    const mainAppDivStyle = {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundSize: 'cover',
      backgroundImage: `url("./assets/background/${this.state.backgroundImage}.png")`
    };

    // Progress bar progress
    const progressIsEnabled = (this.state.launcherState == LauncherState.UPDATING || this.state.launcherState == LauncherState.NEEDS_UPDATE);
    let currentProgress;

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
      <div style={mainAppDivStyle} className={'mainAppDiv'}>
        <div className={'infoButtonsDiv'}>
            <span>
              <SettingsModal initialConfig={this.state.config} onSettingsFormSave={this.onSettingsFormSave} />
              <InfoModal launcherVersion={1.0} />
              <Button compact size={'tiny'} icon onClick={this.onBtnMinimisePressed}>
                <Icon fitted name='window minimize' />
              </Button>
              <Button compact color={'red'} size={'tiny'} icon onClick={this.onBtnQuitPressed}>
                <Icon fitted color={'black'} name='window close' />
              </Button>
            </span>
          </div>
        <div className={'topContentRow'}>
          <div className={'newsContainerDiv'}>
            <NewsDisplay news={this.state.news} />
            <div className='newsFadeBottom' />
          </div>
          <div className={'communityContainerDiv'}>
            <CommunityDisplay news={this.state.news} />
          </div>
        </div>
        <div className={'bottomContentRow'}>
          <div className={'progressContainerDiv'}>
            <div className={'progressInnerDiv'}>
              <Progress precision={0} percent={currentProgress} size={'large'} color={'green'} progress={'percent'} autoSuccess />
            </div>
          </div>
          <div className={'launcherButtonContainerDiv'}>
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
      </div>
    );
  }
}
