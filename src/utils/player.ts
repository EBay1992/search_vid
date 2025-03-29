import { spawn } from 'child_process';
import { platform } from 'os';
import { existsSync } from 'fs';

function findVLCPath(): string | null {
	const os = platform();
	const commonPaths = {
		darwin: [
			'/Applications/VLC.app/Contents/MacOS/VLC',
			'/usr/local/bin/vlc',
			'/usr/bin/vlc'
		],
		win32: [
			'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
			'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe'
		],
		linux: ['/usr/bin/vlc', '/usr/local/bin/vlc']
	};

	const paths = commonPaths[os as keyof typeof commonPaths] || [];
	for (const path of paths) {
		if (existsSync(path)) {
			return path;
		}
	}

	// Try system PATH
	return os === 'win32' ? 'vlc.exe' : 'vlc';
}

export function playVideo(videoPath: string, startTimeMs: number): void {
	const startTimeSeconds = Math.floor(startTimeMs / 1000);
	const vlcPath = findVLCPath();

	if (!vlcPath) {
		console.error('Error: VLC is not installed or not found in the system path.');
		console.error('Please install VLC media player from https://www.videolan.org/');
		return;
	}

	const os = platform();
	let args: string[];

	// VLC command line arguments for different platforms
	switch (os) {
		case 'darwin': // macOS
			args = ['--play-and-exit', '--start-time', startTimeSeconds.toString(), videoPath];
			break;
		case 'win32': // Windows
			args = ['--play-and-exit', '--start-time', startTimeSeconds.toString(), videoPath];
			break;
		case 'linux': // Linux
			args = ['--play-and-exit', '--start-time', startTimeSeconds.toString(), videoPath];
			break;
		default:
			throw new Error(`Unsupported operating system: ${os}`);
	}

	try {
		const process = spawn(vlcPath, args, {
			stdio: 'ignore',
			shell: os === 'win32' // Only use shell on Windows
		});

		process.on('error', (err) => {
			if (err.message.includes('ENOENT')) {
				console.error('Error: VLC is not installed or not found in the system path.');
				console.error('Please install VLC media player from https://www.videolan.org/');
			} else {
				console.error('Error playing video:', err.message);
			}
		});

		process.on('exit', (code) => {
			if (code !== 0) {
				console.error(`VLC exited with code ${code}`);
			}
		});
	} catch (err) {
		if ((err as Error).message.includes('ENOENT')) {
			console.error('Error: VLC is not installed or not found in the system path.');
			console.error('Please install VLC media player from https://www.videolan.org/');
		} else {
			console.error('Error launching video player:', (err as Error).message);
		}
	}
}

export function formatTimeForDisplay(timeMs: number): string {
	const totalSeconds = Math.floor(timeMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const ms = timeMs % 1000;

	return `${hours.toString().padStart(2, '0')}:${minutes
		.toString()
		.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms
			.toString()
			.padStart(3, '0')}`;
}
