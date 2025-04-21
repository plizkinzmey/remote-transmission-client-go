export function themeCleanup(mediaQuery: any, handleSystemThemeChange: any) {
  try {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    } else if (mediaQuery.removeListener) {
      mediaQuery.removeListener(handleSystemThemeChange);
    }
  } catch (cleanupError) {
    // coverage: 156,158-159,161-162
    // eslint-disable-next-line no-console
    console.error("Error removing theme change listener:", cleanupError);
  }
}
