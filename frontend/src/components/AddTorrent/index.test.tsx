import { describe, it, expect } from "vitest";
import { AddTorrent, AddTorrentProps } from "./index";
import { AddTorrent as OriginalAddTorrent } from "./AddTorrent";

describe("AddTorrent index", () => {
  it("экспортирует компонент AddTorrent", () => {
    expect(AddTorrent).toBe(OriginalAddTorrent);
  });

  // Этот тест нужен только для 100% покрытия типов
  it("экспортирует тип AddTorrentProps", () => {
    // Создаем функцию, принимающую пропсы, чтобы TypeScript проверил тип
    const acceptsProps = (props: AddTorrentProps) => props;
    expect(typeof acceptsProps).toBe("function");
  });
});
