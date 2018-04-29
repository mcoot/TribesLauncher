import * as React from 'react';
import { Dropdown, ButtonGroup, DropdownItemProps, Card, Embed } from 'semantic-ui-react';

import { LauncherNews,
         CommunityItem } from '../../common/launcher-news';

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
        };
    }

    renderCommunityItem(item: CommunityItem | null): JSX.Element {
        const cardStyle = {
            height: '100%'
        };

        const cardTemplate = (name: string, body: JSX.Element): JSX.Element => {
            return (
                <Card style={cardStyle} fluid centered>
                    <Card.Content>
                        <Card.Header>
                            {name}
                        </Card.Header>
                    </Card.Content>
                    <Card.Content>
                        {body}
                    </Card.Content>
                </Card>
            );
        };

        if (!item) {
            return cardTemplate('Invalid Item', (
                <span>Community item could not be loaded</span>
            ));
        }

        switch (item.kind) {
            case 'discord':
                const embedStyle = {
                    height: '350px'
                    // overflow: 'auto'
                };
                return cardTemplate(item.name, (
                    <Embed style={embedStyle} active
                        url={`https://discordapp.com/widget?id=${item.serverId}&theme=dark`}
                    />
                ));

            case 'mumble':
                return cardTemplate(item.name, (
                    <span>Host: {item.url}:{item.port}</span>
                ));

            case 'reddit':
                return cardTemplate(item.name, (
                    <span>Sub: /r/{item.sub}</span>
                ));

            case 'iframe':
                const iframeStyle = {
                    height: '350px'
                    // overflow: 'auto'
                };
                return cardTemplate(item.name, (
                    <Embed active style={iframeStyle}
                        url={item.url}
                    />
                ));

            case 'weblink':
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

    OnDropdownSelect = (_: any, {value}: {value: number}): void => {
        if (!this.props.news) {
            return;
        }

        const foundIndex = this.props.news.community.findIndex((item) => item.id == value);

        this.setState((_) => ({
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
            <div className={'communityInnerDiv'}>
                <ButtonGroup fluid color={'grey'}>
                    <Dropdown fluid button options={dropDownItems} onChange={this.OnDropdownSelect} value={currentSelectionItem.id} />
                </ButtonGroup>
                {renderedItem}
            </div>
        );
    }

}
