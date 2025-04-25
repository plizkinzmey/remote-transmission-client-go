import React from 'react';
import { vi } from 'vitest';

// Mock для @radix-ui/themes
vi.mock('@radix-ui/themes', () => ({
    Theme: ({ children, appearance }: { children: React.ReactNode, appearance: string }) => {
        console.log(`<<< Mock RadixTheme rendering with appearance: ${appearance} >>>`);
        return <div data-testid="radix-theme-root" data-appearance={appearance} className={`radix-themes ${appearance}`}>{children}</div>;
    },
}));

// Экспортируем пустой объект, чтобы можно было импортировать этот файл
export { };
