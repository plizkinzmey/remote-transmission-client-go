# Transmission Client Go

[English](#english) | [Русский](#русский)

---
# English

A modern desktop client for Transmission BitTorrent, built with Go and React using Wails framework.

## Documentation

- [Project Overview](docs/overview.md) - Introduction and key features
- [Architecture](docs/architecture.md) - Detailed technical architecture and design
- [Installation & Setup](docs/installation.md) - Getting started guide

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

---
# Русский

Современный десктопный клиент для Transmission BitTorrent, построенный на Go и React с использованием фреймворка Wails.

## Документация

- [Обзор проекта](docs/overview.ru.md) - Введение и ключевые особенности
- [Архитектура](docs/architecture.ru.md) - Детальная техническая архитектура и дизайн
- [Установка и настройка](docs/installation.ru.md) - Руководство по началу работы

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

## License | Лицензия

This project is licensed under the MIT License - see the LICENSE file for details.

Этот проект лицензирован под MIT License - подробности см. в файле LICENSE.
