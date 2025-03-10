# Installation and Setup Guide

## Prerequisites
- Go 1.24 or higher
- Node.js 16+ and npm
- Transmission daemon running and accessible
- Wails CLI installed (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

## Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/transmission-client-go.git
cd transmission-client-go
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install
cd ..

# Install Go dependencies
go mod download
```

### 3. Development Mode
```bash
wails dev
```
This will start the application in development mode with hot reload.

### 4. Building for Production
```bash
wails build
```
The built application will be available in the `build/bin` directory.

## Configuration

### Transmission Daemon Settings
- Host: The hostname where Transmission daemon is running
- Port: Default is 9091
- Username & Password: If authentication is enabled
- HTTPS: For secure connections

### Application Settings
Settings are stored securely using the system keyring:
1. Launch the application
2. Click on Settings
3. Enter your Transmission daemon details
4. Click Save

## Troubleshooting

### Common Issues
1. Connection Failed
   - Verify Transmission daemon is running
   - Check credentials
   - Ensure firewall allows connection

2. Build Issues
   - Update Wails CLI
   - Clean build directory
   - Verify Go and Node.js versions

### Logs
- Development logs are available in the console
- Production logs location varies by platform:
  - macOS: ~/Library/Logs/transmission-client-go/
  - Linux: ~/.local/share/transmission-client-go/logs/
  - Windows: %APPDATA%\transmission-client-go\logs\