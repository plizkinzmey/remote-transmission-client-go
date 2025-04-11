# StatusMessage

Компонент для отображения статусных сообщений с поддержкой различных типов (успех, ошибка, информация).

## Особенности

- 🎨 Поддержка различных типов сообщений (success, error, info)
- 📏 Фиксированная или адаптивная высота
- ♿ Полная поддержка доступности (ARIA)
- 🌗 Поддержка тёмной темы
- 🔄 Анимации появления
- 📱 Поддержка мультистрочности (1-2 строки)
- 🌐 Поддержка RTL

## Использование

```tsx
import { StatusMessage } from './components/StatusMessage';

// Простой пример
<StatusMessage 
  status="success" 
  message="Операция успешно выполнена" 
/>

// С дополнительными настройками
<StatusMessage 
  status="error"
  message="Произошла ошибка при загрузке"
  fixedHeight={false}
  maxLines={1}
  animated={true}
/>
```

## API

### Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|--------------|-----------|
| status | `"success" \| "error" \| "info" \| "none"` | - | Тип статусного сообщения |
| message | `string` | - | Текст сообщения |
| fixedHeight | `boolean` | `true` | Использовать фиксированную высоту |
| height | `string` | `"60px"` | Высота контейнера |
| animated | `boolean` | `true` | Анимация появления |
| maxLines | `1 \| 2` | `2` | Максимальное количество строк |

### CSS переменные

Компонент использует следующие CSS переменные:

```css
--status-success-color: var(--grass-9);
--status-error-color: var(--tomato-9);
--status-info-color: var(--blue-9);
```

В тёмной теме:

```css
--status-success-color: var(--grass-11);
--status-error-color: var(--tomato-11);
--status-info-color: var(--blue-11);
```

## Доступность

- Использует семантические роли `status` и `alert`
- Поддерживает `aria-live` для динамических обновлений
- Иконки помечены как `aria-hidden`
- Текст сообщения имеет `aria-label`

## Примеры

### Успешное сообщение
```tsx
<StatusMessage 
  status="success" 
  message="Настройки успешно сохранены" 
/>
```

### Сообщение об ошибке
```tsx
<StatusMessage 
  status="error" 
  message="Не удалось подключиться к серверу" 
/>
```

### Информационное сообщение
```tsx
<StatusMessage 
  status="info" 
  message="Идет обновление данных..." 
/>
```

### Однострочное сообщение
```tsx
<StatusMessage 
  status="info" 
  message="Короткое сообщение" 
  maxLines={1} 
/>
```