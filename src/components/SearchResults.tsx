import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import path from 'path';
import type {
	SearchResult,
	DisplayOptions,
	SubtitleEntry,
} from '../types/index.js';

interface Props {
	results: SearchResult[];
	query: string;
	options: DisplayOptions;
	onSelect: (result: SearchResult) => void;
	onNewSearch: (query: string, exactMatch: boolean) => void;
	onQuit: () => void;
}

interface FlatMatch extends SearchResult {
	currentMatch: {subtitle: SubtitleEntry; score?: number};
}

function highlightText(text: string, query: string): JSX.Element[] {
	if (!query) return [<Text key="0">{text}</Text>];

	const parts = text.split(new RegExp(`(${query})`, 'gi'));
	return parts.map((part, i) => {
		if (part.toLowerCase() === query.toLowerCase()) {
			return (
				<Text key={i} backgroundColor="yellow" color="black">
					{part}
				</Text>
			);
		}
		return <Text key={i}>{part}</Text>;
	});
}

export function SearchResults({
	results,
	query,
	options,
	onSelect,
	onNewSearch,
	onQuit,
}: Props) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [currentPage, setCurrentPage] = useState(0);
	const [isSearchMode, setIsSearchMode] = useState(false);
	const [newQuery, setNewQuery] = useState('');
	const [pageSize, setPageSize] = useState(options.pageSize ?? 10);

	// Update pageSize when options.pageSize changes
	useEffect(() => {
		// Only update if options.pageSize is explicitly set
		if (options.pageSize !== undefined) {
			setPageSize(Math.min(Math.max(options.pageSize, 5), 100));
		}
	}, [options.pageSize]);

	const flattenedResults = React.useMemo(() => {
		return options.treeView
			? results
			: results.flatMap(result =>
					result.matches.map(
						match =>
							({
								...result,
								currentMatch: match,
								matches: [match],
							} as FlatMatch),
					),
			  );
	}, [results, options.treeView]);

	const totalItems = options.treeView
		? results.length
		: results.reduce((sum, result) => sum + result.matches.length, 0);

	const totalPages = Math.max(1, Math.ceil(flattenedResults.length / pageSize));
	const startIndex = currentPage * pageSize;
	const endIndex = Math.min(startIndex + pageSize, flattenedResults.length);
	const currentResults = flattenedResults.slice(startIndex, endIndex);

	useEffect(() => {
		setSelectedIndex(0);
		setCurrentPage(prev => {
			const maxPage = Math.max(0, totalPages - 1);
			return Math.min(prev, maxPage);
		});
	}, [results, pageSize, totalPages]);

	useInput((input, key) => {
		if (isSearchMode) {
			if (key.return) {
				const isExactSearch = options.exactMatch ?? true;
				const toggleSearch = isExactSearch
					? newQuery.startsWith('?')
					: newQuery.startsWith('!');
				const searchQuery = toggleSearch ? newQuery.slice(1) : newQuery;
				onNewSearch(searchQuery, toggleSearch ? !isExactSearch : isExactSearch);
				setIsSearchMode(false);
				setNewQuery('');
			} else if (key.escape) {
				setIsSearchMode(false);
				setNewQuery('');
			} else if (key.backspace || key.delete) {
				setNewQuery(prev => prev.slice(0, -1));
			} else if (input && input.length === 1) {
				setNewQuery(prev => prev + input);
			}
			return;
		}

		const maxIndex = currentResults.length - 1;

		if (key.upArrow) {
			setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
		} else if (key.downArrow) {
			setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : prev));
		} else if (key.leftArrow) {
			if (currentPage > 0) {
				setCurrentPage(prev => prev - 1);
				setSelectedIndex(0);
			}
		} else if (key.rightArrow) {
			if (currentPage < totalPages - 1) {
				setCurrentPage(prev => prev + 1);
				setSelectedIndex(0);
			}
		} else if (key.return && currentResults[selectedIndex]) {
			const selectedItem = currentResults[selectedIndex];
			onSelect(selectedItem);
		} else if (input === '/') {
			setIsSearchMode(true);
		} else if (input === 'q') {
			onQuit();
		} else if (input === '+') {
			setPageSize(prev => {
				const newSize = prev + 5;
				return newSize <= 100 ? newSize : 100;
			});
		} else if (input === '-') {
			setPageSize(prev => {
				const newSize = prev - 5;
				return newSize >= 5 ? newSize : 5;
			});
		}
	});

	const renderFlatView = () => {
		return (
			<Box flexDirection="column">
				{currentResults.map((item, index) => (
					<Box key={index}>
						<Text>{index === selectedIndex ? '>' : ' '} </Text>
						<Text
							backgroundColor={index === selectedIndex ? 'blue' : undefined}
							color={index === selectedIndex ? 'white' : undefined}
							bold={index === selectedIndex}
						>
							[{startIndex + index + 1}]{' '}
							{highlightText(
								(item as FlatMatch).currentMatch.subtitle.text,
								query,
							)}{' '}
							- {path.basename(item.filePath)}
						</Text>
					</Box>
				))}
			</Box>
		);
	};

	const renderTreeView = () => (
		<Box flexDirection="column">
			{currentResults.map((result, index) => (
				<Box key={index} flexDirection="column">
					<Box>
						<Text>{index === selectedIndex ? '>' : ' '} </Text>
						<Text
							backgroundColor={index === selectedIndex ? 'blue' : undefined}
							color={index === selectedIndex ? 'white' : undefined}
							bold={index === selectedIndex}
						>
							[{startIndex + index + 1}] {path.basename(result.filePath)}
						</Text>
					</Box>
					{result.matches.map((match, matchIndex) => (
						<Box key={matchIndex} marginLeft={2}>
							<Text>
								└─ [{matchIndex + 1}]{' '}
								{highlightText(match.subtitle.text, query)}
							</Text>
						</Box>
					))}
				</Box>
			))}
		</Box>
	);

	return (
		<Box flexDirection="column">
			<Box marginY={1} borderStyle="round" borderColor="blue">
				<Text bold color="blue">
					Results for "{query}" ({totalItems} matches)
				</Text>
			</Box>
			{options.treeView ? renderTreeView() : renderFlatView()}
			{isSearchMode && (
				<Box marginY={1}>
					<Text>
						{newQuery ||
							(options.exactMatch ?? true
								? 'Type to search (? for fuzzy search)'
								: 'Type to search (! for exact search)')}
					</Text>
				</Box>
			)}
			<Box marginTop={2}>
				<Text dimColor>
					{currentPage + 1}/{totalPages} | ↑↓:nav | ←/→:pages | /:search |
					+/-:size | esc:select | q:quit
				</Text>
			</Box>
		</Box>
	);
}
