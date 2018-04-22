import * as download from 'download';

/////// Community Items

export interface CommunityDiscord {
    kind: "discord";
    name: string;
    serverId: string;
}

export interface CommunityMumble {
    kind: "mumble";
    name: string;
    url: string;
    port: string;
}

export interface CommunityReddit {
    kind: "reddit";
    name: string;
    sub: string;
}

export type CommunityItem = CommunityDiscord | CommunityMumble | CommunityReddit;

/////// News

export interface NewsItem {
    title: string;
    date: string;
    body: string;
};

export interface LauncherNews {
    news: NewsItem[];
    community: CommunityItem[];
};

/////// Functions

export const downloadLauncherNews = async (newsUrl: string): Promise<LauncherNews | null> => {
    const newsBuffer = await download(newsUrl).catch(err => null);
    
    if (!newsBuffer) {
        return null;
    }

    // Parse news to JSON - may throw exception if launcher news is invalid
    return JSON.parse(newsBuffer.toString('utf8'));
}