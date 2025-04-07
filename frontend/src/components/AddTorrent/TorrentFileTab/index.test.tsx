import { describe, it, expect } from "vitest";
import { TorrentFileTab } from "./index";
import { TorrentFileTab as OriginalTorrentFileTab } from "./TorrentFileTab";

describe("TorrentFileTab index", () => {
  it("экспортирует компонент TorrentFileTab", () => {
    expect(TorrentFileTab).toBe(OriginalTorrentFileTab);
  });
});
