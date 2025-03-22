# User Guide

This guide provides detailed instructions on how to use the Transmission Client Go application.

## Getting Started

### Connecting to Your Transmission Server

After installing the application, the first step is to connect to your Transmission server:

1. Launch the application
2. You will be presented with a connection setup screen
3. Enter the following information:
   - **Host**: The hostname or IP address of your Transmission server
   - **Port**: The port number of the Transmission RPC interface (default is 9091)
   - **Username**: Your Transmission username (if authentication is enabled)
   - **Password**: Your Transmission password (if authentication is enabled)
4. Click "Test Connection" to verify your settings
5. Once the connection is successful, click "Save" to proceed

### Main Interface Overview

The main interface of Transmission Client Go is divided into several areas:

- **Header**: Contains the application title, theme toggle, language selector, and settings button
- **Status Filter**: Allows you to filter torrents by their status (All, Downloading, Seeding, etc.)
- **Torrent List**: Displays all your torrents with key information about each one
- **Footer**: Shows session statistics such as download/upload speeds and total completed

## Managing Torrents

### Adding Torrents

There are two ways to add torrents:

#### Method 1: Add via URL

1. Click the "+" button in the header
2. Select the "URL" tab
3. Enter the torrent URL
4. Select a download directory
5. Click "Add Torrent"

#### Method 2: Add via File

1. Click the "+" button in the header
2. Select the "File" tab
3. Click "Choose File" and select a torrent file from your computer
4. Select a download directory
5. Click "Add Torrent"

You can also add torrent files by dragging them onto the application window or by opening .torrent files with the application from Finder.

### Viewing Torrent Details

To view detailed information about a torrent:

1. Click on a torrent in the torrent list
2. This will open a detailed view showing:
   - General information (size, progress, ratio, etc.)
   - File list with individual file progress
   - Peer information

### Selecting Files to Download

If you don't want to download all files in a torrent:

1. Click on a torrent to view its details
2. In the "Files" tab, you will see a list of all files in the torrent
3. Uncheck the files you don't want to download
4. Click "Apply Changes"

### Managing Download Location

To manage your download locations:

1. When adding a torrent, click the dropdown next to the download directory field
2. You can select from previously used directories or enter a new one
3. The application remembers your recent download locations for quick access

## Torrent Operations

### Starting and Stopping Torrents

To start or stop torrents:

1. Select one or more torrents in the list by clicking on them (hold Ctrl or Cmd to select multiple)
2. Right-click and select "Start" or "Stop" from the context menu
3. Alternatively, use the start and stop buttons in the toolbar

### Removing Torrents

To remove torrents:

1. Select one or more torrents in the list
2. Right-click and select "Remove" from the context menu
3. Choose whether to also delete the downloaded files
4. Confirm your choice

### Limiting Download Speed

To enable slow mode for specific torrents:

1. Select one or more torrents in the list
2. Right-click and select "Enable Slow Mode" from the context menu
3. The selected torrents will now use the speed limit defined in your settings

## Application Settings

### Connection Settings

To modify your connection settings:

1. Click the settings icon in the header
2. Select the "Connection" tab
3. Update your connection details as needed
4. Click "Test Connection" to verify your new settings
5. Click "Save" to apply the changes

### Speed Limits

To configure speed limits:

1. Click the settings icon in the header
2. Select the "Limits" tab
3. Set the following options:
   - **Slow Mode Speed Limit**: The speed limit (in KB/s or MB/s) when slow mode is enabled
   - **Max Upload Ratio**: The ratio at which torrents will automatically stop seeding
4. Click "Save" to apply the changes

### Interface Settings

#### Changing the Theme

To switch between light and dark themes:

1. Click the theme toggle button in the header
2. The application will immediately switch to the selected theme

#### Changing the Language

To change the application language:

1. Click the language selector in the header
2. Select your preferred language from the dropdown
3. The interface will update to display text in the selected language

## Keyboard Shortcuts

For more efficient usage, the application supports the following keyboard shortcuts:

- **Ctrl/Cmd + A**: Select all torrents
- **Delete**: Remove selected torrents
- **Space**: Start/Stop selected torrents
- **Ctrl/Cmd + +**: Add new torrent
- **Ctrl/Cmd + S**: Enable/Disable slow mode for selected torrents

## Appendix

### Understanding Torrent Statuses

- **Downloading**: Torrent is actively downloading
- **Seeding**: Download completed, torrent is uploading to other peers
- **Stopped**: Torrent is paused
- **Checking**: Torrent is checking existing data
- **Queued**: Torrent is queued for download/upload
- **Completed**: Download finished, not currently seeding

### Understanding Session Statistics

The footer of the application displays session statistics:

- **Download Speed**: Current aggregate download speed
- **Upload Speed**: Current aggregate upload speed
- **Completed**: Total data downloaded in the current session
- **Active**: Number of active torrents