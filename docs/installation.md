# Installation & Setup

This guide provides step-by-step instructions for installing and setting up the Remote Transmission Desktop Client application.

## System Requirements

- **Operating System**: macOS (10.13+)
- **Transmission**: Transmission BitTorrent client running on a local or remote server
- **Disk Space**: ~50MB for the application

## Installation Methods

### Method 1: Download Pre-built Application

1. Go to the [Releases](https://github.com/organization/transmission-client-go/releases) page
2. Download the latest version for macOS
3. Open the downloaded DMG file
4. Drag the application to your Applications folder
5. Open the application from your Applications folder

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

## Configuration

### First-time Setup

1. Launch the application
2. You will be prompted to set up a connection to your Transmission server
3. Enter the following information:
   - **Host**: Hostname or IP address of your Transmission server
   - **Port**: Port number of the Transmission RPC interface (default: 9091)
   - **Username**: Username for authentication (if enabled)
   - **Password**: Password for authentication (if enabled)
   - **Language**: Choose your preferred language

### Advanced Configuration

#### Configuring Speed Limits

1. Open the application
2. Click the Settings icon in the top right corner
3. Go to the "Limits" tab
4. Configure the following settings:
   - **Slow Mode Speed Limit**: The speed limit when slow mode is enabled
   - **Max Upload Ratio**: The maximum upload ratio before seeding stops

#### Customizing the Interface

1. Open the application
2. Click the theme toggle in the top right corner to switch between light and dark themes
3. Use the language selector to change the application language

## Troubleshooting

### Connection Issues

If you have trouble connecting to your Transmission server:

1. Verify that your Transmission server is running
2. Check that the RPC interface is enabled in your Transmission settings
3. Ensure that your firewall allows connections to the Transmission RPC port
4. Verify that the authentication credentials are correct

Note: Remote Transmission Desktop Client features an automatic reconnection system that will attempt to restore the connection if it is lost. You will see a reconnection spinner with an explanatory message when this happens.

### Application Not Starting

If the application fails to start:

1. Check your system logs for error messages
2. Ensure that you meet the minimum system requirements
3. Try reinstalling the application

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
   ~/Library/Application Support/transmission-client-go
   ```