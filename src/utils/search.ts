import fs from 'fs/promises';
import path from 'path';
import glob from 'fast-glob';
import Fuse from 'fuse.js';
import type { SubtitleEntry, SearchResult, SearchOptions } from '../types/index.js';

export async function findSubtitleFiles(verbose = false): Promise<string[]> {
	try {
		if (verbose) {
			console.log('Looking for subtitle files...');
			console.log('Current working directory:', process.cwd());
		}

		const subtitleFiles = await glob(['**/*.srt', '**/*.vtt'], {
			ignore: ['**/node_modules/**'],
			absolute: true,
		});

		if (verbose) {
			console.log(`Found ${subtitleFiles.length} subtitle files:`, subtitleFiles);
		} else {
			console.log(`Found ${subtitleFiles.length} subtitle files`);
		}

		if (subtitleFiles.length === 0) {
			console.log(
				'No subtitle files found in this directory. Make sure you have .srt or .vtt files in your current directory or its subdirectories.',
			);
		}

		return subtitleFiles;
	} catch (err) {
		console.error('Error finding subtitle files:', (err as Error).message);
		console.error('Stack trace:', (err as Error).stack);
		return [];
	}
}

export async function findMatchingVideoFile(
	subtitlePath: string,
	verbose = false
): Promise<string | null> {
	const subtitleDir = path.dirname(subtitlePath);
	let subtitleBasename = path.basename(subtitlePath, path.extname(subtitlePath));

	// Handle any language code format (.en, .eng, .fr, .de, etc.)
	subtitleBasename = subtitleBasename.replace(/\.([a-z]{2,3})$/, '');

	if (verbose) {
		console.log(`Looking for video matching subtitle: ${subtitlePath}`);
		console.log(`Using base name: ${subtitleBasename}`);
	}

	const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];

	// First, try exact match
	for (const ext of videoExtensions) {
		const videoPath = path.join(subtitleDir, `${subtitleBasename}${ext}`);
		try {
			await fs.access(videoPath);
			if (verbose) console.log(`Found matching video: ${videoPath}`);
			return videoPath;
		} catch {
			// File doesn't exist, continue to next extension
		}
	}

	// If no exact match, try to find similar files
	try {
		const dirEntries = await fs.readdir(subtitleDir);
		const videoFiles = dirEntries.filter(file =>
			videoExtensions.includes(path.extname(file).toLowerCase())
		);

		if (videoFiles.length > 0) {
			if (verbose) {
				console.log(`Found ${videoFiles.length} videos in directory. Checking for partial matches...`);
			}

			const normalizedSubName = subtitleBasename.toLowerCase().replace(/[^a-z0-9]/g, '');
			let bestMatch: string | null = null;
			let bestMatchScore = 0;

			for (const videoFile of videoFiles) {
				const videoBasename = path.basename(videoFile, path.extname(videoFile))
					.toLowerCase()
					.replace(/[^a-z0-9]/g, '');

				let score = 0;
				if (videoBasename.includes(normalizedSubName) || normalizedSubName.includes(videoBasename)) {
					const maxLength = Math.max(normalizedSubName.length, videoBasename.length);
					const minLength = Math.min(normalizedSubName.length, videoBasename.length);
					score = minLength / maxLength;
				}

				if (score > bestMatchScore) {
					bestMatchScore = score;
					bestMatch = videoFile;
				}
			}

			if (bestMatch && bestMatchScore > 0.5) {
				const bestMatchPath = path.join(subtitleDir, bestMatch);
				if (verbose) {
					console.log(
						`Found similar video file: ${bestMatchPath} (similarity: ${bestMatchScore.toFixed(2)})`
					);
				}
				return bestMatchPath;
			}
		}
	} catch (err) {
		if (verbose) {
			console.error(`Error reading directory ${subtitleDir}:`, (err as Error).message);
		}
	}

	if (verbose) {
		console.log(`No matching video found for subtitle: ${subtitlePath}`);
	}
	return null;
}

function parseSRT(content: string): SubtitleEntry[] {
	const blocks = content.split(/\r?\n\r?\n/).filter(block => block.trim() !== '');
	const subtitles: SubtitleEntry[] = [];

	for (const block of blocks) {
		const lines = block.split(/\r?\n/);
		if (lines.length < 3) continue;

		const timeLine = lines[1];
		if (!timeLine) continue;

		const timeMatch = timeLine.match(
			/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/
		);

		if (!timeMatch || !timeMatch[1] || !timeMatch[2]) continue;

		const [, startTime, endTime] = timeMatch;
		const text = lines.slice(2).join('\n');

		subtitles.push({
			id: subtitles.length + 1,
			startTime,
			endTime,
			text,
			startTimeMs: timeToMilliseconds(startTime),
			endTimeMs: timeToMilliseconds(endTime)
		});
	}

	return subtitles;
}

function timeToMilliseconds(timeStr: string): number {
	const [time, ms] = timeStr.split(',');
	if (!time || !ms) return 0;

	const [hoursStr, minutesStr, secondsStr] = time.split(':');
	if (!hoursStr || !minutesStr || !secondsStr) return 0;

	const hours = Number(hoursStr);
	const minutes = Number(minutesStr);
	const seconds = Number(secondsStr);

	return (hours * 3600 + minutes * 60 + seconds) * 1000 + Number(ms);
}

async function parseSubtitleFile(
	filePath: string,
	verbose = false
): Promise<SubtitleEntry[]> {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		if (verbose) {
			console.log(`Parsing subtitle file: ${filePath}`);
		}
		return parseSRT(content);
	} catch (err) {
		console.error(`Error parsing subtitle file ${filePath}:`, (err as Error).message);
		return [];
	}
}

export function formatTime(timeInSeconds: number): string {
	const hours = Math.floor(timeInSeconds / 3600);
	const minutes = Math.floor((timeInSeconds % 3600) / 60);
	const seconds = Math.floor(timeInSeconds % 60);
	const ms = Math.floor((timeInSeconds % 1) * 1000);

	return `${hours.toString().padStart(2, '0')}:${minutes
		.toString()
		.padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms
			.toString()
			.padStart(3, '0')}`;
}

export async function searchSubtitles({
	query,
	exactMatch = false,
	verbose = false,
	directory = process.cwd(),
	subtitleExt = 'srt',
	recursive = true
}: SearchOptions & { query: string }): Promise<SearchResult[]> {
	const results: SearchResult[] = [];

	try {
		const pattern = recursive ? `**/*.${subtitleExt}` : `*.${subtitleExt}`;
		const subtitleFiles = await glob([pattern], {
			cwd: directory,
			absolute: true,
			ignore: ['**/node_modules/**']
		});

		if (verbose) {
			console.log(`Found ${subtitleFiles.length} subtitle files to search`);
		}

		for (const subtitleFile of subtitleFiles) {
			const subtitles = await parseSubtitleFile(subtitleFile, verbose);
			const videoPath = await findMatchingVideoFile(subtitleFile, verbose);

			let matches: SearchResult['matches'] = [];

			if (exactMatch) {
				matches = subtitles
					.filter(sub => sub.text.toLowerCase().includes(query.toLowerCase()))
					.map(subtitle => ({ subtitle }));
			} else {
				// @ts-ignore - Fuse.js types are not working correctly
				const fuseInstance = new Fuse(subtitles, {
					keys: ['text'],
					includeScore: true,
					threshold: 0.4
				});

				type FuseResult = {
					item: SubtitleEntry;
					score?: number;
				};

				matches = fuseInstance
					.search(query)
					.map((result: FuseResult) => ({
						subtitle: result.item,
						score: result.score ? 1 - result.score : 1
					}));
			}

			if (matches.length > 0) {
				results.push({
					filePath: subtitleFile,
					videoPath,
					matches
				});
			}
		}

		return results;
	} catch (err) {
		console.error('Error during subtitle search:', (err as Error).message);
		return [];
	}
}
