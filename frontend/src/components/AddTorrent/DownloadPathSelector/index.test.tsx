import { describe, it, expect } from "vitest";
import { DownloadPathSelector } from "./index";
import { DownloadPathSelector as OriginalDownloadPathSelector } from "./DownloadPathSelector";

describe("DownloadPathSelector index", () => {
  it("экспортирует компонент DownloadPathSelector", () => {
    expect(DownloadPathSelector).toBe(OriginalDownloadPathSelector);
  });
});
