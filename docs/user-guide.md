# User Guide

This guide provides detailed instructions on how to use the Remote Transmission Desktop Client application.

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

### Connection Status and Reconnection

The application includes an automatic reconnection system:

1. If connection to the Transmission server is lost, a reconnection spinner will appear
2. The spinner includes a message explaining the possible causes of the connection issue
3. The application will automatically attempt to reconnect
4. You can continue using the application once the connection is restored
5. No manual intervention is required for reconnection

### Main Interface Overview

The main interface of Remote Transmission Desktop Client is divided into several areas:

- **Header**: Contains the application title, theme toggle, language selector, and settings button
- **Status Filter**: Allows you to filter torrents by their status (All, Downloading, Seeding, etc.)
- **Torrent List**: Displays all your torrents with key information about each one
- **Footer**: Shows session statistics such as download/upload speeds and free disk space

## Managing Torrents

### Adding Torrents

There are two ways to add torrents:

#### Method 1: Add via URL

1. Click the "+" button in the header
2. Select the "URL" tab
3. Enter the torrent URL (magnet link or direct .torrent URL)
4. Select a download directory
5. Click "Add Torrent"

#### Method 2: Add via File

1. Click the "+" button in the header
2. Select the "File" tab
3. Click the file drop area or drag a .torrent file into it
4. Select a download directory
5. Click "Add Torrent"

You can also add torrent files by dragging them onto the application window or by opening .torrent files with the application from Finder.

### Selecting Files to Download

To select which files to download within a torrent:

1. In the torrent card, click the folder icon button
2. In the opened file view, you'll see all files in the torrent
3. Use the checkboxes to select or deselect files you want to download
4. Changes are applied automatically

### Managing Download Location

To manage your download locations:

1. When adding a torrent, use the dropdown next to the download directory field
2. You can select from previously used directories or enter a new one
3. To enter a custom path, click "Enter Custom Path"
4. To remove a saved path, click the trash icon next to it in the dropdown

## Torrent Operations

### Starting and Stopping Torrents

To start or stop torrents:

1. Select one or more torrents in the list by clicking their checkboxes
2. Use the start (play) or stop (pause) buttons in the header
3. Alternatively, you can use the start/stop button on individual torrent cards

### Removing Torrents

To remove torrents:

1. Select one or more torrents in the list by clicking their checkboxes
2. Click the delete button in the header
3. Choose whether to also delete the downloaded files
4. Confirm your choice

You can also remove a single torrent by clicking the trash icon on its card.

### Limiting Download Speed

To enable slow mode for specific torrents:

1. Select one or more torrents in the list
2. Click the snail icon in the header to toggle slow mode
3. You can also toggle slow mode for a single torrent by clicking the snail icon on its card

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

To switch between light, dark, and system themes:

1. Click the theme toggle button in the header
2. The theme will cycle through three options:
   - **Light Theme**: Fixed light appearance
   - **Dark Theme**: Fixed dark appearance
   - **System Theme**: Automatically follows your system preferences

#### Changing the Language

To change the application language:

1. Click the language selector in the header
2. Select your preferred language from the dropdown
3. The interface will update to display text in the selected language

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
- **Free Space**: Available disk space in the download directory
- **Transmission Version**: Version of the connected Transmission server