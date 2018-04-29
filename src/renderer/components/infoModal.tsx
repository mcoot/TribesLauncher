import * as React from 'react';
import { Modal } from 'semantic-ui-react';

export interface InfoModalProps {
    trigger: JSX.Element;
    launcherVersion: number;
}

export class InfoModal extends React.Component<InfoModalProps, null> {

    render() {
        return (
            <Modal size={'tiny'} trigger={this.props.trigger}>
                <Modal.Header>
                    TribesLauncher
                </Modal.Header>
                <Modal.Content>
                    <Modal.Description>
                        TribesLauncher version {`${this.props.launcherVersion}`}, developed by mcoot.
                    </Modal.Description>
                </Modal.Content>
            </Modal>
        );
    }

}