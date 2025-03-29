# search_vid

A command-line tool for searching through subtitle files and playing videos at matching timestamps.

## Features

- Search through subtitle files (SRT format supported)
- Fuzzy search or exact match options
- Automatic video file detection
- Interactive navigation through search results
- Cross-platform video playback support
- Pagination for large result sets
- Tree view option for better organization

## Installation

```bash
# Install globally
npm install -g search_vid

# Or install from source
git clone https://github.com/yourusername/search_vid.git
cd search_vid
npm install
npm run build
npm link
```

## Requirements

- Node.js >= 16
- VLC media player installed on your system

## Usage

```bash
# Basic search
search_vid "your search query"

# Search in specific directory
search_vid "query" --directory ~/Videos

# Use exact matching
search_vid "query" --exact-match

# Adjust page size
search_vid "query" --page-size 5

# Use tree view
search_vid "query" --tree-view

# Show help
search_vid --help
```

## Interactive Controls

- ↑/↓: Navigate through results
- ←/→: Change pages
- Enter: Play selected video
- /: Start a new search (use ! prefix for exact match)
- Esc: Exit search mode
- +/-: Adjust page size by 5
- q: Quit the application

## Options

- `--directory, -d`: Directory containing video and subtitle files (default: current directory)
- `--subtitle-ext, -s`: Subtitle file extension (default: srt)
- `--video-ext, -v`: Video file extension (default: mp4)
- `--no-recursive`: Disable recursive search
- `--exact-match, -e`: Use exact matching instead of fuzzy search
- `--verbose`: Show verbose output
- `--page-size, -p`: Number of results per page (default: 10)
- `--tree-view, -t`: Display results in tree view (default: false)
- `--help, -h`: Show help message

## Examples

```bash
# Basic search
search_vid "hello world"

# Search in specific directory with exact match
search_vid "hello world" --directory ./videos --exact-match

# Search with custom page size
search_vid "hello world" --page-size 5

# Search with tree view
search_vid "hello world" --tree-view

# Search with multiple options
search_vid "hello world" --directory ~/Videos --page-size 5 --tree-view
```

## License

MIT
