import * as React from 'react';
import { Header, Modal, Form, Input, Button, Icon, Grid, Divider } from 'semantic-ui-react';

import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import { remote } from 'electron';

import { LauncherConfig } from '../../common/launcher-config';

export interface SettingsModalProps {
    initialConfig: LauncherConfig;
    userConfigPath: string | null;
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

    onSetupUbermenuClick = async () => {
        if (!this.props.userConfigPath) {
            return;
        }

        // The config directory must already exist
        if (!fs.pathExistsSync(this.props.userConfigPath)) {
            return;
        }

        // Check for existing presets
        if (fs.existsSync(`${this.props.userConfigPath}/config.lua`)) {
            const existingConfig = await fs.readFile(`${this.props.userConfigPath}/config.lua`, 'utf8');
            const existingRequires = existingConfig.split('\n').map((line: string) => {
                const m = /^\s*require\("([\w\d\./]+)"\)/.exec(line);
                if (!m) {
                    return null;
                }
                return m[1];
            }).filter(e => e);
            const existingPresets = existingRequires.filter((req: string) => req.startsWith('presets/'));

            // Check for ubermenu specifically
            if (existingPresets.indexOf('presets/ubermenu/preset') !== -1) {
                remote.dialog.showErrorBox('Error enabling Ubermenu', 'Ubermenu is already enabled in your config file.');
                return;
            }

            // Don't set if other presets are active
            if (existingPresets.length > 0) {
                remote.dialog.showErrorBox('Error enabling Ubermenu',
                'Other presets are already enabled in your config. Please enable Ubermenu manually or via the external config tool.');
                return;
            }
        }

        const configLua = `-- Ubermenu preset\nrequire("presets/ubermenu/preset")\n`;

        await fs.appendFile(`${this.props.userConfigPath}/config.lua`, configLua);
    }

    onLaunchConfigToolClick = () => {
        if (!fs.existsSync(this.state.editedConfig.configToolPath)) {
            remote.dialog.showErrorBox('Config tool not found', 'Could not locate the configuration tool. You may need to update TAMods first.');
            return;
        }

        // Launch the config tool completely detached
        const child = spawn(this.state.editedConfig.configToolPath, [], { detached: true, stdio: 'ignore'});
        child.unref();
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
                        <Header>Launcher Settings</Header>
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
                        <Header>TAMods Settings</Header>
                        <Form.Group>
                            <Button compact onClick={this.onSetupUbermenuClick}>Enable Ubermenu Preset</Button>
                            <Button compact onClick={this.onLaunchConfigToolClick}>Launch External Config Tool</Button>
                        </Form.Group>
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