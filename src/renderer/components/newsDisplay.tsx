import * as React from 'react';
import { List, Card } from 'semantic-ui-react';

import { LauncherNews } from '../../common/launcher-news';
import * as ReactMarkdown from 'react-markdown';

export interface NewsDisplayProps {
    news: LauncherNews | null;
}

export interface NewsDisplayState {
    scrollPx: number;
    maxPx: number;
}

export class NewsDisplay extends React.Component<NewsDisplayProps, NewsDisplayState> {

    constructor(props: NewsDisplayProps) {
        super(props);

        this.state = {
            scrollPx: 0,
            maxPx: 0
        };
    }

    componentDidMount() {
        setTimeout(this.onScroll, 500);
    }

    onScroll = () => {
        const el = document.getElementById('newsInnerDiv');

        if (!el) {
            return;
        }
        this.setState((_) => ({
            scrollPx: el.scrollTop,
            maxPx: el.scrollHeight - el.clientHeight
        }));
    }

    render() {
        if (!this.props.news) {
            return (
                <div><p>Unable to retrieve news</p></div>
            );
        }

        const divStyle = {
            width: '80%',
            height: '100%',
            margin: 'auto',
            overflowY: 'auto',
            WebkitMaskImage: ''
        };

        // Determine what scrolling gradients are required
        const gradientHeight = 15;
        let needTopGrad = false;
        let needBottomGrad = false;
        if (this.state.scrollPx > gradientHeight) {
            needTopGrad = true;
        }
        if (this.state.scrollPx < this.state.maxPx - gradientHeight) {
            needBottomGrad = true;
        }

        // apply scrolling gradients
        if (needTopGrad && needBottomGrad) {
            // Both case
            divStyle.WebkitMaskImage = `-webkit-linear-gradient(
                rgba(255, 255, 255, 0) 0,
                rgba(255, 255, 255, 1) ${gradientHeight}px,
                rgba(255, 255, 255, 1) calc(100% - ${gradientHeight}px),
                rgba(255, 255, 255, 0) 100%)`;
        } else if (needTopGrad) {
            // Only top
            divStyle.WebkitMaskImage = `-webkit-linear-gradient(
                rgba(255, 255, 255, 0) 0,
                rgba(255, 255, 255, 1) ${gradientHeight}px)`;
        } else if (needBottomGrad) {
            // Only bottom
            divStyle.WebkitMaskImage = `-webkit-linear-gradient(
                rgba(255, 255, 255, 1) calc(100% - ${gradientHeight}px),
                rgba(255, 255, 255, 0) 100%)`;
        }

        const newsItems = this.props.news!.news.map((ni) => (
            <List.Item className={'newsItem'}  key={ni.id}>
                <Card fluid centered>
                    <Card.Content>
                        <Card.Header>
                            {ni.title}
                        </Card.Header>
                        <Card.Meta>
                            {ni.date}
                        </Card.Meta>
                    </Card.Content>
                    <Card.Content>
                        <ReactMarkdown source={ni.body} />
                    </Card.Content>
                </Card>
            </List.Item>
        ));

        return (
            <div id={'newsInnerDiv'} className={'newsInnerDiv'} style={divStyle} onScroll={this.onScroll}>
                <List className={'newsList'}>
                    {newsItems}
                </List>
            </div>
        );
    }

}