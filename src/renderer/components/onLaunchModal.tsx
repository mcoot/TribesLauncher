import * as React from 'react';
import { Modal, Button, Icon, Form } from 'semantic-ui-react';
import { remote } from 'electron';
import * as fs from 'fs-extra';

import { LauncherConfig } from '../../common/launcher-config';
import { LauncherNews } from '../../common/launcher-news';

export enum OnLaunchModelStatus {
    NOT_OPENED = 0,
    SHOWING_PATH_CONFIG,
    SHOWING_UPDATE_MESSAGE,
    COMPLETED
}

export interface OnLaunchModalProps {
    status: OnLaunchModelStatus;
    config: LauncherConfig;
    news: LauncherNews | null;
    launcherVersion: string;
    onModalButtonClick: (newExecutablePath?: string) => void;
}

export interface OnLaunchModalState {
    currentExecutablePath: string;
    continueButtonEnabled: boolean;
}

export class OnLaunchModal extends React.Component<OnLaunchModalProps, OnLaunchModalState> {

    constructor(props: OnLaunchModalProps) {
        super(props);
        this.state = {
            currentExecutablePath: this.props.config.mainExecutablePath,
            continueButtonEnabled: true
        };
    }

    componentWillMount() {
        if (this.props.status === OnLaunchModelStatus.SHOWING_PATH_CONFIG) {
            const doesFileExist = fs.existsSync(this.state.currentExecutablePath);
            this.setState((s) => ({
                currentExecutablePath: s.currentExecutablePath,
                continueButtonEnabled: doesFileExist
            }));
        }
    }

    onModalClose = () => {
        this.setState((s) => ({
            currentExecutablePath: s.currentExecutablePath,
            continueButtonEnabled: true
        }));

        if (this.props.status === OnLaunchModelStatus.SHOWING_PATH_CONFIG) {
            this.props.onModalButtonClick(this.state.currentExecutablePath);
        } else {
            this.props.onModalButtonClick();
        }
    }

    onPathInputChange = (event: any, {value}: {value: string}) => {
        const doesFileExist = fs.existsSync(value);
        this.setState((s) => ({
            currentExecutablePath: value,
            continueButtonEnabled: doesFileExist
        }));
    }

    onTribesExePathFileClick = () => {
        remote.dialog.showOpenDialog({properties: ['openFile']}, (paths) => {
            if (!paths || paths.length == 0) {
                return;
            }
            const doesFileExist = fs.existsSync(paths[0]);
            this.setState((s) => ({
                currentExecutablePath: paths[0],
                continueButtonEnabled: doesFileExist
            }));
        });
    }

    render() {
        const pathConfigOpen = this.props.status === OnLaunchModelStatus.SHOWING_PATH_CONFIG;
        const updateMessageOpen = this.props.status === OnLaunchModelStatus.SHOWING_UPDATE_MESSAGE;

        const newUpdateVersion = (this.props.news && this.props.news.latestLauncherVersion) || '<unknown>';
        const updateUrl = (this.props.news && this.props.news.launcherUpdateLink) || '<unknown>';

        const modalCloseButton = (
            <Button disabled={!this.state.continueButtonEnabled} compact positive onClick={this.onModalClose}>
                <Icon name='check' />
                 Continue
            </Button>
        );

        return (
            <div>
                <Modal closeOnDimmerClick={false} open={pathConfigOpen}  size={'small'} onClose={this.onModalClose}>
                    <Modal.Header>
                        Path Configuration
                    </Modal.Header>
                    <Modal.Content>
                        <Modal.Description>
                            <p>The launcher was not able to detect the location of TribesAscend.exe.</p>
                            <p> Please enter its location.</p>
                        </Modal.Description>
                        <Form.Input fluid
                            value={this.state.currentExecutablePath}
                            onChange={this.onPathInputChange}
                            action={{icon: 'folder open', onClick: this.onTribesExePathFileClick}} />
                    </Modal.Content>
                    <Modal.Actions>
                        {modalCloseButton}
                    </Modal.Actions>
                </Modal>
                <Modal closeOnDimmerClick={false} open={updateMessageOpen}  size={'small'} onClose={this.onModalClose}>
                    <Modal.Header>
                        Launcher Update Available
                    </Modal.Header>
                    <Modal.Content>
                        <Modal.Description>
                            <p>
                                You're currently using TribesLauncher version <b>{this.props.launcherVersion}</b>;
                                version <b>{newUpdateVersion}</b> is available.
                            </p>
                            <p>You can download the latest version from <a href={updateUrl}>{updateUrl}</a></p>
                        </Modal.Description>
                    </Modal.Content>
                    <Modal.Actions>
                        {modalCloseButton}
                    </Modal.Actions>
                </Modal>
            </div>
        );
    }

}