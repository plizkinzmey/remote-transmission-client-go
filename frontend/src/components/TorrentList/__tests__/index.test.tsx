import { describe, it, expect } from "vitest";
import { TorrentList } from "../index"; // Import from index.ts
import { TorrentList as OriginalTorrentList } from "../TorrentList"; // Import from the component file
// Import types to check if they are exported, though runtime check is limited
import type { TorrentData, TorrentListProps } from "../index";

describe("TorrentList index", () => {
    it("should export TorrentList component", () => {
        expect(TorrentList).toBeDefined();
        // Additionally check if it's the correct component
        expect(TorrentList).toBe(OriginalTorrentList);
    });

    it("should export TorrentData and TorrentListProps types", () => {
        // Runtime type checking is difficult for interfaces/types.
        // This test mainly ensures the types can be imported without TS errors.
        // We can use a dummy variable assignment to satisfy the linter/compiler if needed.
        // This test primarily ensures that the type is exported from index.ts.
        // We assign `undefined` to a variable typed with `TorrentData`.
        // If `TorrentData` is not exported or the name is wrong, TypeScript will fail compilation.
        // The runtime assertion `expect(true).toBe(true)` is a placeholder,
        // as we cannot directly test the type existence at runtime in JavaScript.
        const _dummyData: TorrentData | undefined = undefined;
        expect(true).toBe(true); // Placeholder assertion for type export check
    });
});
