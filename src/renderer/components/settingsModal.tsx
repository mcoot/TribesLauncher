import * as React from 'react';
import { Header, Modal, Form, Input, Button, Icon } from 'semantic-ui-react';

import { remote } from 'electron';

import { LauncherConfig } from '../../common/launcher-config';

export interface SettingsModalProps {
    initialConfig: LauncherConfig;
    trigger: JSX.Element;
}

export interface SettingsModalState {
    editedConfig: LauncherConfig;
    open: boolean;
}

export class SettingsModal extends React.Component<SettingsModalProps, SettingsModalState> {

    constructor(props: SettingsModalProps) {
        super(props);
        this.state = {
            editedConfig: JSON.parse(JSON.stringify(this.props.initialConfig)),
            open: false
        };
    }

    onFormOpen = () => {
        this.setState((_) => ({
            editedConfig: JSON.parse(JSON.stringify(this.props.initialConfig)),
            open: true
        }));
    }

    onFormClose = () => {
        this.setState((s) => ({
            editedConfig: s.editedConfig,
            open: false
        }));
    }

    private onFormChange = (_: any, formData: any) => {
        this.setState((s) => ({
            editedConfig: {
                mainExecutablePath: formData.mainExecutablePath,
                runningProcessName: formData.runningProcessName,
                dllPath: formData.dllPath,
                useDefaultExecutableArgs: s.editedConfig.useDefaultExecutableArgs,
                customExecutableArgs: s.editedConfig.customExecutableArgs,
                masterServerHost: formData.masterServerHost,
                releaseChannel: s.editedConfig.releaseChannel,
                updateUrl: s.editedConfig.updateUrl
            },
            open: s.open
        }));
    }

    onTribesExePathFileClick = () => {
        remote.dialog.showOpenDialog({properties: ['openFile']}, (paths) => {
            const c: LauncherConfig = JSON.parse(JSON.stringify(this.state.editedConfig));
            if (!paths || paths.length == 0) {
                return;
            }
            c.mainExecutablePath = paths[0];
            this.setState((s) => ({
                editedConfig: c,
                open: s.open
            }));
        });
    }

    onDLLPathFileClick = () => {
        remote.dialog.showOpenDialog({properties: ['openFile']}, (paths) => {
            const c: LauncherConfig = JSON.parse(JSON.stringify(this.state.editedConfig));
            if (!paths || paths.length == 0) {
                return;
            }
            c.dllPath = paths[0];
            this.setState((s) => ({
                editedConfig: c,
                open: s.open
            }));
        });
    }

    onFormSubmit = (event: any) => {
        // Stuff
        event.preventDefault();
    }

    render() {
        return (
            <Modal open={this.state.open} onClose={this.onFormClose} closeOnDimmerClick={false} size={'fullscreen'} trigger={
                    <Button compact size={'tiny'} icon onClick={this.onFormOpen}>
                    <Icon name='settings' />
                    </Button>}>
                <Modal.Header>
                    Settings
                </Modal.Header>
                <Modal.Content>
                    <Form onSubmit={this.onFormSubmit}>
                        <Header>Path Settings</Header>
                        <Form.Input
                            label='Tribes Executable Path'
                            name={'mainExecutablePath'}
                            action={{icon: 'folder open', onClick: this.onTribesExePathFileClick}}
                            value={this.state.editedConfig.mainExecutablePath}
                            onChange={this.onFormChange} />
                        <Form.Input
                            label='TAMods DLL Path'
                            name={'dllPath'}
                            action={{icon: 'folder open', onClick: this.onDLLPathFileClick}}
                            value={this.state.editedConfig.dllPath}
                            onChange={this.onFormChange} />
                        <Form.Group>
                            <Form.Input
                                label='Tribes Process Name'
                                name={'runningProcessName'}
                                value={this.state.editedConfig.runningProcessName}
                                onChange={this.onFormChange} />
                            <Form.Input
                                label='Login Server Host'
                                name={'masterServerHost'}
                                value={this.state.editedConfig.masterServerHost}
                                onChange={this.onFormChange} />
                        </Form.Group>
                        <Header>Launcher Settings</Header>
                        <Form.Group>
                            <Form.Button onClick={this.onFormClose} negative>
                                <Icon name='cancel' />
                                Cancel
                            </Form.Button>
                            <Form.Button positive>
                            <Icon name='save' />
                                Save
                            </Form.Button>
                        </Form.Group>

                    </Form>
                </Modal.Content>
            </Modal>
        );
    }

}