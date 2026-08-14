import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("system status foundation", () => {
  test("Web renders backend availability and passes critical accessibility checks", async ({ page }) => {
    test.skip(!test.info().project.name.startsWith("web"), "Web check runs in the Web projects");
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "System status" })).toBeVisible();
    await expect(page.getByText("Available")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(consoleErrors).toEqual([]);

    const accessibilityScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(accessibilityScan.violations).toEqual([]);
  });

  test("Admin renders backend availability and passes critical accessibility checks", async ({ page }) => {
    test.skip(!test.info().project.name.startsWith("admin"), "Admin check runs in the Admin projects");
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "System status" })).toBeVisible();
    await expect(page.getByText("Available")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(consoleErrors).toEqual([]);

    const accessibilityScan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(accessibilityScan.violations).toEqual([]);
  });
});
