import { describe, it, expect } from "vitest";
import { TorrentUrlTab } from "./index";
import { TorrentUrlTab as OriginalTorrentUrlTab } from "./TorrentUrlTab";

describe("TorrentUrlTab index", () => {
  it("экспортирует компонент TorrentUrlTab", () => {
    expect(TorrentUrlTab).toBe(OriginalTorrentUrlTab);
  });
});
