import * as React from 'react';
import { Dropdown, DropdownItemProps } from 'semantic-ui-react';

import { LauncherNews, 
         CommunityItem, 
         CommunityDiscord,
         CommunityMumble, 
         CommunityReddit, 
         CommunityWeblink } from '../launcher-news';

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

    renderCommunityItem(item: CommunityItem): JSX.Element {
        switch (item.kind) {
            case "discord":
                return (
                    <p>Server ID: {item.serverId}</p>
                );

            case "mumble":
                return (
                    <p>Host: {item.url}:{item.port}</p>
                );

            case "reddit":
                return (
                    <p>Sub: /r/{item.sub}</p>
                );

            case "weblink":
                return (
                    <p><link href={item.url}>Link</link></p>
                );


            default:
                return (
                    <p>Invalid community information</p>
                );
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
                <div><p>Unable to retrieve communities</p></div>
            );
        }
        if (this.props.news.community.length == 0) {
            return (
                <div><p>No community info to display</p></div>
            );
        }
        if (this.state.currentCommunityIndex >= this.props.news.community.length) {
            return (
                <div><p>Invalid community selection</p></div>
            );
        }

        const currentSelectionItem = this.props.news.community[this.state.currentCommunityIndex];

        const dropDownItems = this.props.news.community.map(this.GetDropdownItem);

        // Render community details
        const renderedItem = this.renderCommunityItem(currentSelectionItem);

        return (
            <div>
                <Dropdown options={dropDownItems} onChange={this.OnDropdownSelect} value={currentSelectionItem.id} />
                {renderedItem}
            </div>
        );
    }

}
