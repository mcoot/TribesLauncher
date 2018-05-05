import * as React from 'react';
import { Header, Modal, Form, Input, Button, Icon, Grid } from 'semantic-ui-react';

import { remote } from 'electron';

import { LauncherConfig } from '../../common/launcher-config';

export interface SettingsModalProps {
    initialConfig: LauncherConfig;
    onSettingsFormSave: (updatedConfig: LauncherConfig) => void;
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

    private onFormChange = (_: any, {name, value}: {name: string, value: any}) => {
        const newConfig = JSON.parse(JSON.stringify(this.state.editedConfig));
        newConfig[name] = value;
        this.setState((s) => ({
            editedConfig: newConfig,
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
        console.log(this.state.open);
        remote.dialog.showOpenDialog(remote.getCurrentWindow(), {properties: ['openFile']}, (paths) => {
            console.log(this.state.open);
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
        const newConfig = JSON.parse(JSON.stringify(this.state.editedConfig));
        this.props.onSettingsFormSave(newConfig);
        this.setState((s) => ({
            editedConfig: s.editedConfig,
            open: false
        }));
        event.preventDefault();
    }

    render() {
        return (
            <Modal open={this.state.open} onClose={this.onFormClose} closeOnDimmerClick={false} size={'large'} trigger={
                    <Button compact size={'tiny'} icon onClick={this.onFormOpen}>
                    <Icon name='settings' />
                    </Button>}>
                <Modal.Header>
                    Settings
                </Modal.Header>
                <Modal.Content>
                    <Form>
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
                            {/* <Form.Input
                                label='Tribes Process Name'
                                name={'runningProcessName'}
                                value={this.state.editedConfig.runningProcessName}
                                onChange={this.onFormChange} /> */}
                            <Form.Input
                                label='Login Server Host'
                                name={'masterServerHost'}
                                value={this.state.editedConfig.masterServerHost}
                                onChange={this.onFormChange} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Button compact onClick={this.onFormClose} negative>
                                    <Icon name='cancel' />
                                    Cancel
                            </Form.Button>
                            <Form.Button compact onClick={this.onFormSubmit} positive>
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