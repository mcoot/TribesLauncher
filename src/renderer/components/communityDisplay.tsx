import * as React from 'react';
import { Dropdown, DropdownItemProps, Card } from 'semantic-ui-react';

import { LauncherNews, 
         CommunityItem, 
         CommunityDiscord,
         CommunityMumble, 
         CommunityReddit, 
         CommunityWeblink } from '../../common/launcher-news';

export interface CommunityDisplayProps {
    news: LauncherNews | null;
}

export interface CommunityDisplayState {
    currentCommunityIndex: number;
}

export class CommunityDisplay extends React.Component<CommunityDisplayProps, CommunityDisplayState> {

    constructor(props: CommunityDisplayProps) {
        super(props);

        this.state = {
            currentCommunityIndex: 0
        }
    }

    componentDidMount() {
        
    }

    renderCommunityItem(item: CommunityItem | null): JSX.Element {
        const cardTemplate = (name: string, body: JSX.Element): JSX.Element => {
            return (
                <Card>
                    <Card.Header>
                        {name}
                    </Card.Header>
                    <Card.Content>
                        {body}
                    </Card.Content>
                </Card>
            );
        }

        if (!item) {
            return cardTemplate('Invalid Item', (
                <span>Community item could not be loaded</span>
            ));
        }

        switch (item.kind) {
            case "discord":
                return cardTemplate(item.name, (
                    <span>Server ID: {item.serverId}</span>
                ));

            case "mumble":
                return cardTemplate(item.name, (
                    <span>Host: {item.url}:{item.port}</span>
                ));

            case "reddit":
                return cardTemplate(item.name, (
                    <span>Sub: /r/{item.sub}</span>
                ));

            case "weblink":
                return cardTemplate(item.name, (
                    <span><link href={item.url}>Link</link></span>
                ));

            default:
                return cardTemplate('Invalid Item', (
                    <span>Community item could not be loaded</span>
                ));
        }
        
    }

    GetDropdownItem(item: CommunityItem): DropdownItemProps {
        return {
            text: item.name,
            value: item.id
        };
    }

    OnDropdownSelect = (event: any, {value}: {value: number}): void => {
        if (!this.props.news) {
            return;
        }

        const foundIndex = this.props.news.community.findIndex((item) => item.id == value);

        this.setState((s) => ({
            currentCommunityIndex: foundIndex
        }));
    }

    render() {
        if (!this.props.news) {
            return (
                <div>
                    {this.renderCommunityItem(null)}
                </div>
            );
        }
        if (this.props.news.community.length == 0) {
            return (
                <div>
                    {this.renderCommunityItem(null)}
                </div>
            );
        }
        if (this.state.currentCommunityIndex >= this.props.news.community.length) {
            return (
                <div>
                    {this.renderCommunityItem(null)}
                </div>
            );
        }

        const currentSelectionItem = this.props.news.community[this.state.currentCommunityIndex];

        const dropDownItems = this.props.news.community.map(this.GetDropdownItem);

        // Render community details
        const renderedItem = this.renderCommunityItem(currentSelectionItem);

        return (
            <div>
                <Dropdown button options={dropDownItems} onChange={this.OnDropdownSelect} value={currentSelectionItem.id} />
                {renderedItem}
            </div>
        );
    }

}
