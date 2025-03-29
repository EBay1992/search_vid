#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ search_vid <query>

	Options
		--directory, -d     Directory containing video and subtitle files (default: current directory)
		--subtitle-ext, -s  Subtitle file extension (default: srt)
		--video-ext, -v    Video file extension (default: mp4)
		--no-recursive     Disable recursive search
		--exact-match, -e  Use exact matching instead of fuzzy search
		--verbose         Show verbose output
		--page-size, -p   Number of results per page (default: 10)
		--tree-view, -t   Display results in tree view (default: false)
		--help, -h        Show this help message

	Interactive Controls
		↑/↓              Navigate through results
		←/→              Change pages
		Enter            Play selected video
		/                Start a new search (use ! prefix for exact match)
		Esc              Exit search mode
		+/-              Adjust page size by 5
		q                Quit the application

	Examples
	  $ search_vid "hello world"
	  $ search_vid "hello world" --directory ./videos --exact-match
	  $ search_vid "hello world" --no-recursive --subtitle-ext srt --page-size 5
	  $ search_vid "hello world" --tree-view
	  $ search_vid --help
`,
	{
		importMeta: import.meta,
		flags: {
			directory: {
				type: 'string',
				alias: 'd',
				default: process.cwd(),
			},
			subtitleExt: {
				type: 'string',
				alias: 's',
				default: 'srt',
			},
			videoExt: {
				type: 'string',
				alias: 'v',
				default: 'mp4',
			},
			recursive: {
				type: 'boolean',
				default: true,
			},
			exactMatch: {
				type: 'boolean',
				alias: 'e',
				default: true,
			},
			verbose: {
				type: 'boolean',
				default: false,
			},
			pageSize: {
				type: 'number',
				alias: 'p',
				default: 10,
			},
			treeView: {
				type: 'boolean',
				alias: 't',
				default: false,
			},
		},
	},
);

if (!cli.input[0]) {
	console.error('Please provide a search query');
	process.exit(1);
}

render(
	<App
		query={cli.input[0]}
		options={{
			directory: cli.flags.directory,
			subtitleExt: cli.flags.subtitleExt,
			videoExt: cli.flags.videoExt,
			recursive: cli.flags.recursive,
			exactMatch: cli.flags.exactMatch,
			verbose: cli.flags.verbose,
			pageSize: cli.flags.pageSize,
			treeView: cli.flags.treeView,
		}}
	/>,
);
