# Transmission Client Go Overview

## Introduction
Transmission Client Go is a desktop application that provides a modern, user-friendly interface for managing torrents through the Transmission BitTorrent client. Built with Go and React, it combines the power of native desktop applications with the flexibility of web technologies.

## Key Features
- Modern desktop interface for Transmission
- Secure credential storage using system keyring
- Real-time torrent status monitoring
- Support for adding and managing torrents
- Search and filter functionality
- Secure communication with Transmission daemon
- Cross-platform support (macOS, Windows, Linux)

## Technology Stack
- **Backend:**
  - Go 1.24.0
  - Wails v2 (desktop application framework)
  - TransmissionRPC library for communication with Transmission daemon
  - System keyring integration for secure credential storage

- **Frontend:**
  - React 
  - TypeScript
  - Vite
  - CSS Modules for styling

## Architecture
The application follows Clean Architecture principles with distinct layers:
- Domain Layer (core business logic)
- Application Layer (use cases)
- Infrastructure Layer (external services integration)
- Presentation Layer (UI components)

See [architecture.md](architecture.md) for detailed architectural information.