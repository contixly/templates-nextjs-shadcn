/** @jest-environment node */

describe("i18n request config", () => {
  test("falls back to the default locale for unknown locales", async () => {
    const { loadI18nMessagesConfig } = await import("../../src/i18n/messages");

    await expect(loadI18nMessagesConfig("de")).resolves.toMatchObject({
      locale: "en",
    });
  });

  test("loads common and feature namespaces for english", async () => {
    const { loadI18nMessagesConfig } = await import("../../src/i18n/messages");

    const config = await loadI18nMessagesConfig("en");

    expect(config.locale).toBe("en");
    expect(config.messages.common.words.verbs.save).toBe("Save");
    expect(config.messages.accounts.pages.login.openGraph.title).toBe("Sign In");
    expect(config.messages.application.pages.home.title).toBe("Home");
    expect(config.messages.workspaces.pages.workspaces.title).toBe("Workspaces");
    expect(config.messages.dashboard.pages.application_dashboard.title).toBe("Dashboard");
    expect(config.messages.accounts.ui.profileForm.submit).toBe("Save");
    expect(config.messages.workspaces.ui.createDialog.submit).toBe("Create");
    expect(config.messages.application.ui.homeCta.primary).toBe("Get Started");
    expect(config.messages.dashboard.ui.sectionCards.cards.revenue.label).toBe("Total Revenue");
  });

  test("loads russian locale messages with the same namespace shape", async () => {
    const { loadI18nMessagesConfig } = await import("../../src/i18n/messages");

    const config = await loadI18nMessagesConfig("ru");

    expect(config.locale).toBe("ru");
    expect(config.messages.common.words.verbs.save).toBeTruthy();
    expect(config.messages.accounts.pages.login.openGraph.title).toBeTruthy();
    expect(config.messages.application.pages.home.title).toBeTruthy();
    expect(config.messages.workspaces.pages.workspaces.title).toBeTruthy();
    expect(config.messages.dashboard.pages.application_dashboard.title).toBeTruthy();
    expect(config.messages.accounts.ui.profileForm.submit).toBeTruthy();
    expect(config.messages.workspaces.ui.createDialog.submit).toBeTruthy();
    expect(config.messages.application.ui.homeCta.primary).toBeTruthy();
    expect(config.messages.dashboard.ui.sectionCards.cards.revenue.label).toBeTruthy();
  });
});
