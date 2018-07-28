import * as React from 'react';
import { Label, Header, Modal, Form, Input, Button, Icon, Grid, Divider } from 'semantic-ui-react';

import { remote } from 'electron';

import { LauncherConfig, MasterServerMode } from '../../common/launcher-config';
import { LauncherNews } from '../../common/launcher-news';

export interface SettingsModalProps {
    initialConfig: LauncherConfig;
    launcherNews: LauncherNews | null;
    userDataPath: string | null;
    userConfigPath: string | null;
    onSettingsFormSave: (updatedConfig: LauncherConfig) => void;
    // onUninstallComplete: () => void;
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
        if (name === 'launchViaSteam' || name === 'autoInjectEnabled') {
            value = value !== 1;
        }
        if (name === 'autoInjectTimer') {
            value = parseInt(value) || 20;
        }

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
                        Configure Launcher
                    </Button>}>
                <Modal.Header>
                    Launcher Settings
                </Modal.Header>
                <Modal.Content>
                    <Form>
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
                        <Header as='h5' content='Login Server'/>
                        <Form.Group>
                            {/* <Form.Input
                                label='Tribes Process Name'
                                name={'runningProcessName'}
                                value={this.state.editedConfig.runningProcessName}
                                onChange={this.onFormChange} /> */}
                            <Form.Radio
                                label='HiRez'
                                name='masterServerMode'
                                value={MasterServerMode.HIREZ}
                                checked={this.state.editedConfig.masterServerMode === MasterServerMode.HIREZ}
                                onChange={this.onFormChange}
                            />
                            <Form.Radio
                                label='Unofficial'
                                name='masterServerMode'
                                value={MasterServerMode.UNOFFICIAL}
                                disabled={this.props.launcherNews
                                            && (this.props.launcherNews.masterServers.unofficialMasterServerHost === '')
                                            || false}
                                checked={this.state.editedConfig.masterServerMode === MasterServerMode.UNOFFICIAL}
                                onChange={this.onFormChange}
                            />
                            <Form.Radio
                                label='Custom'
                                name='masterServerMode'
                                value={MasterServerMode.CUSTOM}
                                checked={this.state.editedConfig.masterServerMode === MasterServerMode.CUSTOM}
                                onChange={this.onFormChange}
                            />
                            <Form.Input
                                label='Login Server Host'
                                name={'masterServerHost'}
                                disabled={this.state.editedConfig.masterServerMode !== MasterServerMode.CUSTOM}
                                value={this.state.editedConfig.masterServerHost}
                                onChange={this.onFormChange} />
                        </Form.Group>
                        <Form.Checkbox
                            onChange={this.onFormChange}
                            name={'launchViaSteam'}
                            label='Launch Via Steam'
                            checked={this.state.editedConfig.launchViaSteam}
                            value={this.state.editedConfig.launchViaSteam ? 1 : 0}
                        />
                        <Form.Checkbox
                            onChange={this.onFormChange}
                            name={'autoInjectEnabled'}
                            label='Enable Auto-Inject'
                            checked={this.state.editedConfig.autoInjectEnabled}
                            value={this.state.editedConfig.autoInjectEnabled ? 1 : 0}
                        />
                        <Form.Group>
                            <Form.Input
                                type='number'
                                label='Auto-Inject Timer'
                                name={'autoInjectTimer'}
                                value={this.state.editedConfig.autoInjectTimer}
                                onChange={this.onFormChange} />
                        </Form.Group>
                        {/* <Header>TAMods Settings</Header>
                        <Form.Group>
                            <Button compact onClick={this.onSetupUbermenuClick}>Enable Ubermenu Preset</Button>
                            <Button compact onClick={this.onLaunchConfigToolClick}>Launch External Config Tool</Button>
                            <Button compact onClick={this.onForceReinstallClick}>Force Reinstall</Button>
                        </Form.Group> */}
                        <Divider />
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