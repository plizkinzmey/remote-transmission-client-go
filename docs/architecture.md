# Architecture

This document describes the architectural design of the Transmission Client Go application.

## Overview

Transmission Client Go follows the principles of Clean Architecture, with a clear separation of concerns between the different layers of the application. The architecture is designed to be maintainable, testable, and flexible.

## Architecture Layers

The application is organized into the following layers:

### 1. Domain Layer

The domain layer contains the core business logic and entities of the application. It is independent of other layers and frameworks.

**Key Components:**
- `domain/torrent.go`: Defines the Torrent model and related interfaces
- `domain/config.go`: Configuration entities
- `domain/session_stats.go`: Session statistics entities

The domain layer defines interfaces that are implemented by the infrastructure layer, following the Dependency Inversion Principle.

### 2. Application Layer

The application layer orchestrates the flow of data between the domain and infrastructure layers. It contains the application's use cases.

**Key Components:**
- `application/torrent_service.go`: Service for managing torrents and implementing business rules

This layer coordinates the work of domain entities and infrastructure services to accomplish specific tasks, such as adding torrents, managing download paths, and controlling upload ratios.

### 3. Infrastructure Layer

The infrastructure layer implements the interfaces defined in the domain layer. It contains the concrete implementations for external services and technologies.

**Key Components:**
- `infrastructure/transmission_client.go`: Implementation of the Transmission API client
- `infrastructure/config_service.go`: Configuration management service
- `infrastructure/localization_service.go`: Localization service
- `infrastructure/encryption_service.go`: Service for secure storage of sensitive data

### 4. User Interface Layer

The user interface layer handles the presentation logic and user interaction. In this application, it consists of:

- **Backend UI Integration**: `app.go` serves as the bridge between the Go backend and the React frontend
- **Frontend**: React components in the `frontend/src` directory

## Data Flow

The typical data flow in the application follows these steps:

1. User interacts with the UI (React frontend)
2. UI calls methods exposed by `app.go`
3. App delegates to the application service layer
4. Application layer coordinates with domain and infrastructure layers
5. Results flow back up through the layers to the UI

## Key Design Patterns

The application employs several design patterns:

- **Repository Pattern**: Abstracts data access through the `TorrentRepository` interface
- **Service Pattern**: Application services encapsulate business logic
- **Dependency Injection**: Dependencies are provided to components rather than created internally
- **Context API (React)**: For state management in the frontend

## Directory Structure

```
├── app.go                  # UI integration layer
├── main.go                 # Entry point
├── internal/
│   ├── application/        # Application services
│   │   └── torrent_service.go
│   ├── domain/             # Domain models and interfaces
│   │   ├── config.go
│   │   ├── session_stats.go
│   │   └── torrent.go
│   └── infrastructure/     # External services implementation
│       ├── config_service.go
│       ├── encryption_service.go
│       ├── localization_service.go
│       └── transmission_client.go
├── frontend/               # React UI components
│   └── src/
│       ├── components/     # UI components
│       ├── contexts/       # React contexts for state management
│       ├── hooks/          # Custom React hooks
│       └── types/          # TypeScript types
└── locales/                # Localization files
    ├── en.json
    └── ru.json
```

## Frontend Architecture

The frontend follows a component-based architecture using React and TypeScript:

- **Components**: Reusable UI components in `frontend/src/components`
- **Contexts**: React Context API for state management in `frontend/src/contexts`
- **Custom Hooks**: Shared logic and state management in `frontend/src/hooks`
- **CSS Modules**: Scoped styling for components

## Communication Between Frontend and Backend

Communication between the React frontend and the Go backend is facilitated by the Wails framework:

1. Go functions are exposed via the `Bind` parameter in `main.go`
2. TypeScript bindings are generated in `frontend/wailsjs/go/`
3. Frontend components call these bindings to invoke Go functions

## Error Handling

The application implements a comprehensive error handling strategy:

- Domain errors are defined in the domain layer
- Infrastructure errors are mapped to domain errors when appropriate
- Application services handle and translate errors for the UI
- Localized error messages are provided to the user

## Configuration Management

Configuration is managed through:

- Local storage for user preferences
- Secure storage for sensitive information like credentials
- Runtime configuration for application settings

## Localization

The application supports multiple languages through:

- JSON translation files in the `locales` directory
- A localization service in the infrastructure layer
- React components that consume translations via a context

## Security Considerations

- Credentials are stored securely using platform-specific encryption
- Communication with the Transmission server uses authentication
- Input validation is performed at multiple levels