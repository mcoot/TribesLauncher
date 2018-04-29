import * as React from 'react';
import { DropdownItemProps } from 'semantic-ui-react';
import { LauncherNews, CommunityItem } from '../../common/launcher-news';
export interface CommunityDisplayProps {
    news: LauncherNews | null;
}
export interface CommunityDisplayState {
    currentCommunityIndex: number;
}
export declare class CommunityDisplay extends React.Component<CommunityDisplayProps, CommunityDisplayState> {
    constructor(props: CommunityDisplayProps);
    renderCommunityItem(item: CommunityItem | null): JSX.Element;
    GetDropdownItem(item: CommunityItem): DropdownItemProps;
    OnDropdownSelect: (_: any, { value }: {
        value: number;
    }) => void;
    render(): JSX.Element;
}
