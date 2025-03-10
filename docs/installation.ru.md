# Руководство по установке и настройке

## Предварительные требования
- Go 1.24 или выше
- Node.js 16+ и npm
- Запущенный и доступный демон Transmission
- Установленный Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

## Настройка для разработки

### 1. Клонирование репозитория
```bash
git clone https://github.com/yourusername/transmission-client-go.git
cd transmission-client-go
```

### 2. Установка зависимостей
```bash
# Установка frontend зависимостей
cd frontend
npm install
cd ..

# Установка Go зависимостей
go mod download
```

### 3. Режим разработки
```bash
wails dev
```
Это запустит приложение в режиме разработки с горячей перезагрузкой.

### 4. Сборка для продакшена
```bash
wails build
```
Собранное приложение будет доступно в директории `build/bin`.

## Конфигурация

### Настройки демона Transmission
- Host: Хост, где запущен демон Transmission
- Port: По умолчанию 9091
- Username & Password: Если включена аутентификация
- HTTPS: Для безопасных соединений

### Настройки приложения
Настройки хранятся безопасно в системном keyring:
1. Запустите приложение
2. Нажмите на Настройки
3. Введите данные вашего демона Transmission
4. Нажмите Сохранить

## Устранение неполадок

### Частые проблемы
1. Ошибка подключения
   - Проверьте, запущен ли демон Transmission
   - Проверьте учетные данные
   - Убедитесь, что брандмауэр разрешает подключение

2. Проблемы сборки
   - Обновите Wails CLI
   - Очистите директорию сборки
   - Проверьте версии Go и Node.js

### Логи
- Логи разработки доступны в консоли
- Расположение логов в продакшене зависит от платформы:
  - macOS: ~/Library/Logs/transmission-client-go/
  - Linux: ~/.local/share/transmission-client-go/logs/
  - Windows: %APPDATA%\transmission-client-go\logs\