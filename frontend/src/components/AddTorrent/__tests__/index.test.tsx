import { describe, it, expect } from "vitest";
import { AddTorrent } from "../index"; // <--- Corrected path
import { AddTorrent as OriginalAddTorrent } from "../AddTorrent"; // <--- Corrected path

describe("AddTorrent index", () => {
  it("should export AddTorrent component", () => {
    expect(AddTorrent).toBeDefined();
    // Дополнительно проверяем, что это действительно тот компонент
    expect(AddTorrent).toBe(OriginalAddTorrent);
  });
});
