# Transmission Client Go

[English](#english) | [Русский](#русский)

<div align="center">
  <img src="build/appicon.png" alt="Transmission Client Logo" width="128">
</div>

---

# English

A modern desktop client for Transmission BitTorrent, built with Go and React using Wails framework.

## Features

- Intuitive and responsive user interface
- Support for adding torrents via URL or file
- Detailed torrent information and file management
- Speed control with configurable throttling
- Full localization support (English and Russian)
- Dark and light theme support
- macOS native integration

## Documentation

- [Project Overview](docs/overview.md) - Introduction and key features
- [Architecture](docs/architecture.md) - Detailed technical architecture and design
- [Installation & Setup](docs/installation.md) - Getting started guide
- [User Guide](docs/user-guide.md) - Complete user documentation

## Quick Start

1. Install prerequisites:
   - Go 1.24+
   - Node.js 16+
   - Wails CLI

2. Run in development mode:
   ```bash
   wails dev
   ```

3. Build for production:
   ```bash
   wails build
   ```

## Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115.

For detailed development instructions, see our [Installation & Setup Guide](docs/installation.md).

## Project Structure

```
├── app.go                 # Main application logic
├── main.go                # Entry point
├── internal/              # Core application code
│   ├── application/       # Application services 
│   ├── domain/            # Domain models and interfaces
│   └── infrastructure/    # External services implementation
├── frontend/              # React UI code
├── locales/               # Localization files
└── docs/                  # Documentation
```

---

# Русский

Современный десктопный клиент для Transmission BitTorrent, построенный на Go и React с использованием фреймворка Wails.

## Возможности

- Интуитивно понятный и отзывчивый пользовательский интерфейс
- Поддержка добавления торрентов через URL или файл
- Подробная информация о торрентах и управление файлами
- Контроль скорости с настраиваемым ограничением
- Полная поддержка локализации (английский и русский)
- Поддержка темной и светлой темы
- Нативная интеграция с macOS

## Документация

- [Обзор проекта](docs/overview.ru.md) - Введение и ключевые особенности
- [Архитектура](docs/architecture.ru.md) - Детальная техническая архитектура и дизайн
- [Установка и настройка](docs/installation.ru.md) - Руководство по началу работы
- [Руководство пользователя](docs/user-guide.ru.md) - Полная пользовательская документация

## Быстрый старт

1. Установите необходимые компоненты:
   - Go 1.24+
   - Node.js 16+
   - Wails CLI

2. Запуск в режиме разработки:
   ```bash
   wails dev
   ```

3. Сборка для продакшена:
   ```bash
   wails build
   ```

## Разработка

Для запуска в режиме живой разработки выполните `wails dev` в директории проекта. Это запустит сервер разработки Vite,
который обеспечит быструю горячую перезагрузку ваших изменений во frontend. Если вы хотите разрабатывать в браузере
и иметь доступ к методам Go, также доступен сервер разработки по адресу http://localhost:34115.

Подробные инструкции по разработке см. в нашем [Руководстве по установке и настройке](docs/installation.ru.md).

## Структура проекта

```
├── app.go                 # Основная логика приложения
├── main.go                # Точка входа
├── internal/              # Основной код приложения
│   ├── application/       # Сервисы приложения
│   ├── domain/            # Доменные модели и интерфейсы
│   └── infrastructure/    # Реализация внешних сервисов
├── frontend/              # React UI код
├── locales/               # Файлы локализации
└── docs/                  # Документация
```

## License | Лицензия

This project is licensed under the MIT License - see the LICENSE file for details.

Этот проект лицензирован под MIT License - подробности см. в файле LICENSE.
