# Project Overview

## Introduction

Transmission Client Go is a modern desktop client application for Transmission BitTorrent, designed to provide a user-friendly interface for managing torrents. Built on Go and React with the Wails framework, it offers a seamless experience for users who want an efficient way to interact with their Transmission server.

## Key Features

### User Interface

- **Modern Design**: Clean and intuitive interface built with React
- **Dark/Light Theme**: Support for both dark and light themes
- **Localization**: Full support for English and Russian languages

### Torrent Management

- **Torrent List**: View all your torrents with detailed information
- **Add Torrents**: Add torrents via URL or local file
- **File Management**: Select which files to download within torrents
- **Batch Operations**: Perform operations on multiple torrents at once
- **Detailed Information**: View comprehensive stats for each torrent

### Performance Controls

- **Speed Throttling**: Limit download and upload speeds
- **Auto-stop Seeding**: Configure maximum upload ratio to automatically stop seeding
- **Download Path Management**: Manage and save download paths for easy access

### Integration

- **macOS Native Integration**: Support for macOS file associations and system events
- **Secure Connection**: Connect to your Transmission server securely

## Technology Stack

- **Backend**: Go programming language
- **Frontend**: React with TypeScript
- **Framework**: Wails (Go + Web Technologies)
- **State Management**: React Context API
- **Styling**: CSS Modules
- **Localization**: Custom localization system with JSON-based translations
- **Building**: Wails build system with Vite

## Architecture

The application follows a clean architecture approach with clear separation of concerns:

- **Domain Layer**: Core business logic and entities
- **Application Layer**: Application services that orchestrate the domain
- **Infrastructure Layer**: External services implementation
- **User Interface Layer**: React components and views

For more detailed information about the architecture, please refer to the [Architecture Document](architecture.md).

## Target Audience

This application is designed for:

- Users who prefer a desktop application over web interfaces
- Users who want a modern, feature-rich client for Transmission
- macOS users who want native integration with their operating system

## Current Status

The application is currently in active development with a focus on macOS support. It includes all the essential features for torrent management while maintaining a user-friendly interface.

## Future Plans

- Additional filtering and sorting options
- Advanced scheduling features
- Remote server management
- Statistics and reporting
- Additional platform support