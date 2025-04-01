# Installation & Setup Guide

## System Requirements

- **Operating System**: macOS (10.13+)
- **Transmission**: Transmission BitTorrent client running on a local or remote server
- **Disk Space**: ~20MB for the application

## Installation Methods

### Method 1: Download Pre-built Application

1. Go to the [Releases](https://github.com/organization/transmission-client-go/releases) page
2. Download the latest version for macOS
3. Open the downloaded archive
4. Drag the application to your Applications folder
5. **Important**: For first launch:
   - Open Terminal
   - Run the following command to allow unsigned application execution:
     ```bash
     xattr -dr com.apple.quarantine /Applications/RemTransClient.app
     ```
   - Now you can open the application by double-clicking it in the Applications folder

### Method 2: Build from Source

#### Prerequisites

- Go 1.24+
- Node.js 16+
- Wails CLI

#### Installing Go

1. Download the macOS installer from the [Go website](https://golang.org/dl/)
2. Follow the installation instructions
3. Verify your installation by opening Terminal and running:
   ```bash
   go version
   ```

#### Installing Node.js

1. Download the macOS installer from the [Node.js website](https://nodejs.org/)
2. Follow the installation instructions
3. Verify your installation by opening Terminal and running:
   ```bash
   node --version
   npm --version
   ```

#### Installing Wails

1. Open Terminal and run:
   ```bash
   go install github.com/wailsapp/wails/v2/cmd/wails@latest
   ```
2. Verify your installation by running:
   ```bash
   wails version
   ```

#### Building the Application

1. Clone the repository:
   ```bash
   git clone https://github.com/organization/transmission-client-go.git
   cd transmission-client-go
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. Build the application:
   ```bash
   wails build
   ```

4. The built application will be available in the `build/bin` directory

## Updating

To update to a newer version:

1. Download the latest version from the [Releases](https://github.com/organization/transmission-client-go/releases) page
2. Replace your existing installation with the new version

Your settings and preferences will be preserved when updating.

## Uninstallation

To uninstall the application:

1. Drag the application from your Applications folder to the Trash
2. To remove all application data and settings, delete the following folder:
   ```
   ~/Library/Application Support/transmission-client
   ```