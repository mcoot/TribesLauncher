import * as React from 'react';
import { LauncherNews } from '../launcher-news';
import * as ReactMarkdown from 'react-markdown';

export interface NewsDisplayProps {
    news: LauncherNews | null;
}

export class NewsDisplay extends React.Component<NewsDisplayProps, null> {

    render() {
        if (!this.props.news) {
            return (
                <div><p>Unable to retrieve news</p></div>
            );
        }

        const newsItems = this.props.news!.news.map((ni) => (
            <li key={ni.id}>
                <h3>{ni.title}</h3>
                <span>{ni.date}</span>
                <ReactMarkdown source={ni.body} />
            </li>
        ));

        return (
            <ul>
                {newsItems}
            </ul>
        );
    }

}