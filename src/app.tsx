import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import {searchSubtitles} from './utils/search.js';
import {SearchResults} from './components/SearchResults.js';
import {playVideo} from './utils/player.js';
import type {SearchResult, SearchOptions} from './types/index.js';

interface Props {
	query: string;
	options: SearchOptions;
}

export default function App({query, options}: Props) {
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedMatchIndex] = useState(0);
	const [currentQuery, setCurrentQuery] = useState(query);

	const performSearch = async (searchQuery: string, exactMatch = false) => {
		setIsSearching(true);
		setError(null);
		setCurrentQuery(searchQuery);
		try {
			const searchResults = await searchSubtitles({
				query: searchQuery,
				exactMatch,
				...options,
			});
			setResults(searchResults);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setIsSearching(false);
		}
	};

	useEffect(() => {
		void performSearch(query);
	}, [query]);

	if (error) {
		return (
			<Box>
				<Text color="red">Error: {error}</Text>
			</Box>
		);
	}

	if (isSearching) {
		return (
			<Box>
				<Text>Searching for "{currentQuery}"...</Text>
			</Box>
		);
	}

	return (
		<SearchResults
			results={results}
			query={currentQuery}
			options={{
				pagination: true,
				pageSize: options.pageSize || 10,
				treeView: options.treeView || false,
				exactMatch: options.exactMatch || true,
			}}
			onSelect={result => {
				if (result.videoPath) {
					const selectedMatch = result.matches[selectedMatchIndex];
					if (selectedMatch) {
						playVideo(result.videoPath, selectedMatch.subtitle.startTimeMs);
					}
				} else {
					console.error('No video file found for this subtitle');
				}
			}}
			onNewSearch={(newQuery, exactMatch) => {
				void performSearch(newQuery, exactMatch);
			}}
			onQuit={() => {
				process.exit(0);
			}}
		/>
	);
}
