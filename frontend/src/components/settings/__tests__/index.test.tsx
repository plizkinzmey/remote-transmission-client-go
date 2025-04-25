// Tests for Settings index.ts
import { describe, it, expect } from 'vitest';
import { Settings } from '../index';
import { Settings as OriginalSettings } from '../Settings';

describe('Settings index', () => {
    it('should re-export Settings component', () => {
        expect(Settings).toBeDefined();
        expect(Settings).toBe(OriginalSettings);
    });

    // TODO: Add test for SettingsProps re-export if needed
});
