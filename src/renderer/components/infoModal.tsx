import * as React from 'react';
import { Modal, Button, Icon } from 'semantic-ui-react';

import { LauncherNews } from '../../common/launcher-news';

export interface InfoModalProps {
    launcherVersion: string;
    news: LauncherNews | null;
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
        const updateLink = (this.props.news && this.props.news.launcherUpdateLink) || 'https://github.com/mcoot/TribesLauncher/releases';

        return (
            <Modal closeOnDimmerClick={false} open={this.state.open} size={'small'} onClose={this.onClose} trigger={
                    <Button onClick={this.onOpen} compact size={'tiny'} icon>
                        <Icon  name='info' />
                    </Button>}>
                <Modal.Header>
                    TribesLauncher
                </Modal.Header>
                <Modal.Content>
                    <Modal.Description>
                        <p>Version <b>{`${this.props.launcherVersion}`}</b></p>
                        <p>Developed by mcoot</p>
                        <p>Get updates and view the source code at: <a href={updateLink}>{updateLink}</a></p>
                        <p>For support, or to submit bug reports or feedback, either raise an issue on GitHub,
                           or contact mcoot directly via Reddit (/u/avianistheterm) or Discord (mcoot#7419)</p>
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