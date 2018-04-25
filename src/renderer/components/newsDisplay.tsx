import * as React from 'react';
import { List, Card } from 'semantic-ui-react';

import { LauncherNews } from '../../common/launcher-news';
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
            <List.Item key={ni.id}>
                <Card>
                    <Card.Header>
                        {ni.title}
                    </Card.Header>
                    <Card.Meta>
                        {ni.date}
                    </Card.Meta>
                    <Card.Content>
                        <ReactMarkdown source={ni.body} />
                    </Card.Content>
                </Card>
            </List.Item>
        ));

        return (
            <ul>
                {newsItems}
            </ul>
        );
    }

}