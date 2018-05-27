import * as download from 'download';

/////// Community Items

export interface CommunityDiscord {
    id: number;
    kind: 'discord';
    name: string;
    serverId: string;
    pugOrgChannels: string[];
    gameChannels: {
           be: string;
           ds: string;
        }[];
}

export interface CommunityMumble {
    id: number;
    kind: 'mumble';
    name: string;
    url: string;
    port: string;
}

export interface CommunityReddit {
    id: number;
    kind: 'reddit';
    name: string;
    sub: string;
}

export interface CommunityIframe {
    id: number;
    kind: 'iframe';
    name: string;
    url: string;
}

export interface CommunityWeblink {
    id: number;
    kind: 'weblink';
    name: string;
    url: string;
}

export type CommunityItem = CommunityDiscord | CommunityMumble | CommunityReddit | CommunityIframe | CommunityWeblink;

/////// INIs

export interface IniPreset {
    name: string;
    category: string;
    description: string;
    remotePath: string;
}

/////// News

export interface NewsItem {
    id: number;
    title: string;
    date: string;
    body: string;
}

export interface LauncherNews {
    news: NewsItem[];
    community: CommunityItem[];
    latestLauncherVersion: string;
    launcherUpdateLink: string;
    iniPresets: IniPreset[];
}

/////// Functions

export const downloadLauncherNews = async (newsUrl: string): Promise<LauncherNews | null> => {
    const newsBuffer = await download(newsUrl).catch(err => null);

    if (!newsBuffer) {
        return null;
    }

    // Parse news to JSON - may throw exception if launcher news is invalid
    const result = JSON.parse(newsBuffer.toString('utf8'));
    return result;
};