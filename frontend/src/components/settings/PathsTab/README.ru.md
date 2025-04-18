# Компонент `PathsTab`

## Обзор

Компонент `PathsTab` предоставляет пользовательский интерфейс в настройках приложения для управления путями загрузки. Он позволяет пользователям:

- Просматривать список сохраненных путей загрузки.
- Видеть текущий путь загрузки по умолчанию (отмечен звездочкой).
- Добавлять новые пути загрузки с валидацией.
- Удалять существующие пути загрузки с подтверждением.
- Устанавливать любой сохраненный путь в качестве пути загрузки по умолчанию.

## Пропсы (Props)

- `onPathsChanged?: (hasChanges: boolean) => void;`
  - Необязательная функция обратного вызова, которая вызывается всякий раз, когда обновляется состояние ожидающих изменений (добавления, удаления, изменение пути по умолчанию). Она получает булево значение, указывающее, есть ли несохраненные изменения.

## Ref Handle (`PathsTabRef`)

Компонент использует `forwardRef` и предоставляет следующие методы и свойства через свой ref:

- `saveChanges: () => Promise<void>;`
  - Асинхронно сохраняет все ожидающие изменения (добавленные пути, удаленные пути, новый путь по умолчанию) путем вызова бэкенда.
- `resetChanges: () => void;`
  - Отменяет все ожидающие изменения и возвращает отображаемые пути и путь по умолчанию к их состоянию на момент загрузки компонента или последнего сохранения.
- `getPathChanges: () => { pathsToAdd: string[]; pathsToRemove: string[]; defaultPath: string | null; };`
  - Возвращает объект, содержащий списки путей, ожидающих добавления и удаления, а также путь, выбранный в качестве нового пути по умолчанию (или `null`, если путь по умолчанию не изменился).
- `hasChanges: boolean;`
  - Булево свойство, указывающее, есть ли какие-либо ожидающие изменения, которые не были сохранены.

## Кастомный хук: `usePathsManagement`

Вся логика управления состоянием, включая получение путей, обработку взаимодействий пользователя (добавление, удаление, установка по умолчанию), валидацию, отслеживание ожидающих изменений и взаимодействие с бэкендом (через функции Wails), инкапсулирована в кастомном хуке `usePathsManagement` (`./hooks/usePathsManagement.ts`). Компонент `PathsTab` в основном использует состояние и функции, возвращаемые этим хуком, для рендеринга пользовательского интерфейса.

## Пример использования

```tsx
import React, { useRef, useState, useEffect } from 'react';
import { PathsTab, PathsTabRef } from './PathsTab'; // Предполагая реэкспорт из index.ts
import { Button } from '@radix-ui/themes';

function SettingsDialog() {
  const pathsTabRef = useRef<PathsTabRef>(null);
  const [hasPathChanges, setHasPathChanges] = useState(false);

  const handleSaveChanges = async () => {
    if (pathsTabRef.current) {
      try {
        await pathsTabRef.current.saveChanges();
        console.log('Изменения путей успешно сохранены!');
        setHasPathChanges(false); // Сбросить индикатор изменений
      } catch (error) {
        console.error('Не удалось сохранить изменения путей:', error);
        // Обработка отображения ошибки
      }
    }
  };

  const handleCancelChanges = () => {
    if (pathsTabRef.current) {
      pathsTabRef.current.resetChanges();
      setHasPathChanges(false); // Сбросить индикатор изменений
    }
  };

  // Обновляем локальное состояние при изменениях в PathsTab
  const handlePathsChanged = (changesExist: boolean) => {
    setHasPathChanges(changesExist);
  };

  // Альтернативно, можно проверять ref напрямую при необходимости
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (pathsTabRef.current) {
  //       setHasPathChanges(pathsTabRef.current.hasChanges);
  //     }
  //   }, 500); // Проверять периодически или по событиям
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div>
      <h2>Настройки</h2>
      {/* Другие вкладки настроек */}
      <PathsTab ref={pathsTabRef} onPathsChanged={handlePathsChanged} />
      {/* Другие вкладки настроек */}

      <div style={{ marginTop: '20px' }}>
        <Button onClick={handleSaveChanges} disabled={!hasPathChanges}>
          Сохранить пути
        </Button>
        <Button onClick={handleCancelChanges} disabled={!hasPathChanges} variant="soft" color="gray">
          Отменить изменения путей
        </Button>
      </div>
    </div>
  );
}

export default SettingsDialog;
```

## Стилизация

Стили, специфичные для компонента, определены в `PathsTab.module.css` с использованием CSS Modules.
