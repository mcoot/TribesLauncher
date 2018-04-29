import * as React from 'react';
import { Modal, Button, Icon } from 'semantic-ui-react';

export interface InfoModalProps {
    launcherVersion: number;
}

export interface InfoModelState {
    open: boolean;
}

export class InfoModal extends React.Component<InfoModalProps, InfoModelState> {

    constructor(props: InfoModalProps) {
        super(props);
        this.state = {
            open: false
        };
    }

    onOpen = () => {
        this.setState({
            open: true
        });
    }

    onClose = () => {
        this.setState({
            open: false
        });
    }

    render() {
        return (
            <Modal closeOnDimmerClick={false} open={this.state.open} size={'tiny'} onClose={this.onClose} trigger={
                    <Button onClick={this.onOpen} compact size={'tiny'} icon>
                        <Icon  name='info' />
                    </Button>}>
                <Modal.Header>
                    TribesLauncher
                </Modal.Header>
                <Modal.Content>
                    <Modal.Description>
                        TribesLauncher version {`${this.props.launcherVersion}`}, developed by mcoot.
                    </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                    <Button compact onClick={this.onClose}>
                        <Icon name='close' />
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }

}