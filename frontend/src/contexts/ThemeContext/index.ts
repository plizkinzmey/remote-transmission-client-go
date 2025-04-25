/**
 * @file Exports the Theme context, provider, hook, and related types.
 * @module contexts/ThemeContext
 */

export {
  ThemeProvider,
  useTheme,
  ThemeContext,
  getSystemTheme,
  getInitialThemeState, // Добавляем экспорт getInitialThemeState
} from "./ThemeContext";
export type { ThemeType, ThemeContextProps } from "./ThemeContext";
