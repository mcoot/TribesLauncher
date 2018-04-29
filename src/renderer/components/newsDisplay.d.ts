import * as React from 'react';
import { LauncherNews } from '../../common/launcher-news';
export interface NewsDisplayProps {
    news: LauncherNews | null;
}
export declare class NewsDisplay extends React.Component<NewsDisplayProps, null> {
    render(): JSX.Element;
}
