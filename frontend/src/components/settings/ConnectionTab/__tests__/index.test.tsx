import * as Exports from '../index';
// Заменяем импорты Jest на Vitest
import { describe, it, expect, vi } from 'vitest';
import { ConnectionConfig } from '../../../../App'; // Импортируем реальный тип
import { ConnectionTab as OriginalComponent } from '../ConnectionTab'; // Импорт из файла компонента для сравнения

describe('ConnectionTab index exports', () => {
    it('should export ConnectionTab component', () => {
        expect(Exports.ConnectionTab).toBeDefined();
        // Дополнительно проверяем, что это правильный компонент
        expect(Exports.ConnectionTab).toBe(OriginalComponent);
    });

    it('should export ConnectionTabProps type', () => {
        // Types are removed at runtime, so we can't directly check Exports.ConnectionTabProps
        // This test mainly serves as documentation and ensures the export exists in the source.
        // We can test if the key exists if needed, but it's less meaningful for types.
        // Дополняем dummyProps недостающими полями
        const dummyProps: Exports.ConnectionTabProps = {
            settings: {
                host: '',
                port: 0,
                username: '',
                password: '',
                maxUploadRatio: 0, // Добавлено
                slowSpeedLimit: 0, // Добавлено
                slowSpeedUnit: 'KiB/s', // Исправлено с "KB/s" на "KiB/s"
            } as ConnectionConfig, // Указываем тип явно
            onSettingsChange: vi.fn(), // Используем vi.fn()
        };
        expect(dummyProps).toBeDefined();
    });

    it('should not export useConnectionTest hook', () => {
        // Cast to any to check for the property at runtime
        expect((Exports as any).useConnectionTest).toBeUndefined();
    });
});
