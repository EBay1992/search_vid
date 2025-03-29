export interface SubtitleEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  startTimeMs: number;
  endTimeMs: number;
}

export interface SearchResult {
  filePath: string;
  videoPath: string | null;
  matches: Array<{
    subtitle: SubtitleEntry;
    score?: number;
  }>;
}

export interface SearchOptions {
  exactMatch?: boolean;
  verbose?: boolean;
  directory?: string;
  subtitleExt?: string;
  videoExt?: string;
  recursive?: boolean;
  pageSize?: number;
  treeView?: boolean;
}

export interface DisplayOptions {
  pagination?: boolean;
  pageSize?: number;
  treeView?: boolean;
  exactMatch?: boolean;
}

export type SearchAction =
  | { type: 'QUIT' }
  | { type: 'NEW_SEARCH'; query: string; exactMatch: boolean }
  | { type: 'SELECT'; result: SearchResult };
