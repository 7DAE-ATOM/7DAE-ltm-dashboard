import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { selectFirstBenchAsRoot } from "./utils";

test.use({ viewport: { width: 1440, height: 900 } });

const TRIGGER = "Export diagram";

test("the export menu lists the three formats with their extensions", async ({
  page,
}) => {
  await selectFirstBenchAsRoot(page);
  await page.getByRole("button", { name: TRIGGER }).click();

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("Export as");
  for (const [format, extension] of [
    ["PNG", ".png"],
    ["SVG", ".svg"],
    ["Mermaid", ".mmd"],
  ]) {
    const item = menu.getByRole("menuitem", { name: format });
    await expect(item).toBeVisible();
    await expect(item).toContainText(extension);
  }
});

test("the menu closes on Escape and on an outside click", async ({ page }) => {
  await selectFirstBenchAsRoot(page);
  const trigger = page.getByRole("button", { name: TRIGGER });
  const menu = page.getByRole("menu");

  await trigger.click();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);

  await trigger.click();
  await expect(menu).toBeVisible();
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await expect(menu).toHaveCount(0);
});

/* Mermaid is the format worth asserting in CI: it is pure string generation,
 * so it is deterministic. PNG and SVG go through the browser's rasteriser and
 * its font fallbacks, which makes their bytes a poor thing to assert on. */
test("Mermaid downloads a .mmd describing the displayed benches", async ({
  page,
}) => {
  const rootNode = await selectFirstBenchAsRoot(page);
  const rootName = (await rootNode.innerText()).split("\n")[0].trim();

  await page.getByRole("button", { name: TRIGGER }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Mermaid" }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/\.mmd$/);
  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  const text = await readFile(filePath!, "utf8");
  expect(text.startsWith("flowchart LR")).toBe(true);
  // The one selected bench is a root, so it carries the double-bracket shape.
  expect(text).toContain("[[");
  // Truncated on the card, whole in the export.
  if (!rootName.endsWith("...")) expect(text).toContain(rootName);
});

test("SVG downloads a .svg", async ({ page }) => {
  await selectFirstBenchAsRoot(page);
  await page.getByRole("button", { name: TRIGGER }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "SVG" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.svg$/);
});

test("the export button is disabled while the diagram is empty", async ({
  page,
}) => {
  await page.goto("/depgraph");
  await expect(page.getByRole("combobox", { name: "Select a bench" })).toBeVisible();
  await expect(page.getByRole("button", { name: TRIGGER })).toBeDisabled();
});
