import * as React from 'react';
import { Dropdown, ButtonGroup, DropdownItemProps, Card, Embed, Segment, SegmentGroup, Header } from 'semantic-ui-react';
import { remote, shell } from 'electron';

import { LauncherNews,
         CommunityItem } from '../../common/launcher-news';

export interface RedditPostData {
    title: string;
    author: string;
    url: string;
    date: Date;
}

export interface CommunityDisplayProps {
    news: LauncherNews | null;
}

export interface CommunityDisplayState {
    currentCommunityIndex: number;
    redditData: RedditPostData[];
}

export class CommunityDisplay extends React.Component<CommunityDisplayProps, CommunityDisplayState> {

    constructor(props: CommunityDisplayProps) {
        super(props);

        this.state = {
            currentCommunityIndex: 0,
            redditData: []
        };
    }

    renderCommunityItem(item: CommunityItem | null): JSX.Element {
        const cardStyle = {
            height: '100%'
        };

        const cardBodyStyle = {
            height: '100%',
            overflow: 'auto'
        };

        const cardTemplate = (name: string, body: JSX.Element): JSX.Element => {
            return (
                <Card style={cardStyle} fluid centered>
                    <Card.Content>
                        <Card.Header>
                            {name}
                        </Card.Header>
                    </Card.Content>
                    <Card.Content style={cardBodyStyle}>
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
                // if (!this.state.redditData || this.state.redditData.length === 0) {
                //     return cardTemplate(item.name, (
                //         <span>Sub: /r/{item.sub}</span>
                //     ));
                // }

                const redditSegmentStyle = {
                    cursor: 'pointer'
                };

                const redditPosts = this.state.redditData.map((post, idx) => {
                    return (
                        <Segment key={idx} style={redditSegmentStyle} onClick={() => shell.openExternal(post.url)}>
                            <Header size={'small'}>{post.title}</Header>
                            <Header sub size={'small'}>{post.author}</Header>
                        </Segment>
                    );
                });
                return cardTemplate( item.name,
                    <SegmentGroup>
                        {redditPosts}
                    </SegmentGroup>
                );

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

    OnDropdownSelect = async (_: any, {value}: {value: number}): Promise<void> => {
        if (!this.props.news) {
            return;
        }

        const foundIndex = this.props.news.community.findIndex((item) => item.id == value);

        this.setState((s) => ({
            currentCommunityIndex: foundIndex,
            redditData: s.redditData
        }));

        const foundItem = this.props.news.community[foundIndex];
        if (foundItem.kind === 'reddit') {
            const response = await window.fetch(`https://www.reddit.com/r/${foundItem.sub}/hot.json`);
            const body = await response.json();

            const redditPosts = body.data.children.filter((p: any) => !p.data.stickied).map((p: any) => ({
                title: decodeURIComponent(p.data.title),
                author: p.data.author,
                url: `https://www.reddit.com${p.data.permalink}`,
                date: new Date(p.data.created)
            }));

            this.setState((s) => ({
                currentCommunityIndex: s.currentCommunityIndex,
                redditData: redditPosts
            }));
        }
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
                <Dropdown fluid selection options={dropDownItems} onChange={this.OnDropdownSelect} value={currentSelectionItem.id} />
                {renderedItem}
            </div>
        );
    }

}
