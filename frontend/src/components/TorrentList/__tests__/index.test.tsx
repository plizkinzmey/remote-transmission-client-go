// filepath: /Users/plizkinzmey/SRC/transmission-client-go/frontend/src/components/TorrentList/__tests__/index.test.tsx
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
        const _dummyData: TorrentData | undefined = undefined;
        const _dummyProps: TorrentListProps | undefined = undefined;
        expect(true).toBe(true); // Placeholder assertion
    });
});
