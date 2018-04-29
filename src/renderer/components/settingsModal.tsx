import * as React from 'react';
import { Modal, Form, Input, Button, Icon } from 'semantic-ui-react';

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
                runningProcessName: s.editedConfig.runningProcessName,
                dllPath: formData.dllPath,
                useDefaultExecutableArgs: s.editedConfig.useDefaultExecutableArgs,
                customExecutableArgs: s.editedConfig.customExecutableArgs,
                masterServerHost: s.editedConfig.masterServerHost,
                releaseChannel: s.editedConfig.releaseChannel,
                updateUrl: s.editedConfig.updateUrl
            },
            open: s.open
        }));
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
                        <Form.Input
                            label='Tribes Executable Path'
                            name={'mainExecutablePath'}
                            action={{icon: 'folder open'}}
                            value={this.state.editedConfig.mainExecutablePath}
                            onChange={this.onFormChange} />
                        <Form.Input
                            label='TAMods DLL Path'
                            name={'dllPath'}
                            action={{icon: 'folder open'}}
                            value={this.state.editedConfig.dllPath}
                            onChange={this.onFormChange} />
                        <Form.Group>
                            <Form.Button onClick={this.onFormClose} negative icon='save'>Cancel</Form.Button>
                            <Form.Button positive icon='cancel'>Save</Form.Button>
                        </Form.Group>
                    </Form>
                </Modal.Content>
            </Modal>
        );
    }

}