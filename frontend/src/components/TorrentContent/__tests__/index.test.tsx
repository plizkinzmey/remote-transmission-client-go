import { describe, it, expect } from "vitest";
import { TorrentContent } from "../index"; // Импорт из index.ts
import type { TorrentContentProps } from "../index"; // Импорт типа из index.ts
import { TorrentContent as OriginalTorrentContent } from "../TorrentContent"; // Импорт из файла компонента

describe("TorrentContent index", () => {
    it("должен экспортировать компонент TorrentContent", () => {
        expect(TorrentContent).toBeDefined();
        // Дополнительно проверяем, что это действительно тот компонент
        expect(TorrentContent).toBe(OriginalTorrentContent);
    });

    it("должен экспортировать тип TorrentContentProps", () => {
        // Проверка существования типа во время компиляции
        const testProps: TorrentContentProps = {
            id: 1,
            name: "Test",
            open: true, // Add the missing 'open' property
            onClose: () => { },
        };
        expect(testProps).toBeDefined();
        expect(typeof testProps).toBe("object");
    });
});
