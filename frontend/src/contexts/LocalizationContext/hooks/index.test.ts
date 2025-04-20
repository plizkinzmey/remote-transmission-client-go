import * as hooks from "./index";
describe("hooks index", () => {
  it("exports useTranslations and useLanguageInitialization", () => {
    expect(hooks.useTranslations).toBeDefined();
    expect(hooks.useLanguageInitialization).toBeDefined();
  });
});
