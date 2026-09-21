import { test, expect, type Page } from "@playwright/test";
import { openSection, pinDensity } from "./utils";

// FilterBar is mounted twice (desktop sidebar + mobile FilterSheet); forcing
// a desktop viewport keeps only the sidebar instance interactive and avoids
// strict-mode locator collisions between the two mounts.
test.use({ viewport: { width: 1440, height: 900 } });

const COUNT_RE = /(\d+)\s*\/\s*(\d+)\s*lab test means/;

async function readCount(page: Page): Promise<{ shown: number; total: number }> {
  const text = await page.getByText(COUNT_RE).innerText();
  const m = COUNT_RE.exec(text);
  if (!m) throw new Error(`Could not parse count from "${text}"`);
  return { shown: Number(m[1]), total: Number(m[2]) };
}

test.beforeEach(async ({ page }) => {
  // Pin 3×2 so the per-page arithmetic below stays 6, independent of the
  // 5×5 default.
  await pinDensity(page, { columns: 3, rows: 2 });
  await page.goto("/");
  await expect(
    page.getByPlaceholder("Search lab test means, references, managers…"),
  ).toBeVisible();
});

test("a photo filter narrows or keeps the result count, never grows it", async ({ page }) => {
  const before = await readCount(page);

  await openSection(page, "Photo");
  await page
    .getByRole("radiogroup", { name: "Photo filter" })
    .getByRole("radio", { name: "With photo" })
    .click();

  const after = await readCount(page);
  expect(after.total).toBe(before.total);
  expect(after.shown).toBeLessThanOrEqual(before.total);

  const cards = page.locator('main section a[href^="/labtestmean?id="]');
  if (after.shown === 0) {
    await expect(page.getByText("No lab test mean matches these filters.")).toBeVisible();
  } else {
    // Density pinned to 3 columns × 2 rows above, so a page holds 6.
    await expect(cards).toHaveCount(Math.min(after.shown, 6));
  }
});

test("combining two filters never shows more results than either alone", async ({ page }) => {
  await openSection(page, "Photo");
  await page
    .getByRole("radiogroup", { name: "Photo filter" })
    .getByRole("radio", { name: "With photo" })
    .click();
  const afterPhoto = await readCount(page);

  await openSection(page, "Quality seal");
  await page
    .getByRole("radiogroup", { name: "Quality seal filter" })
    .getByRole("radio", { name: "Released" })
    .click();
  const afterBoth = await readCount(page);

  expect(afterBoth.shown).toBeLessThanOrEqual(afterPhoto.shown);
});

test("free-text search matches the query against visible results", async ({ page }) => {
  const before = await readCount(page);
  test.skip(before.total === 0, "No data returned by the backend to search over");

  const firstCardText = await page
    .locator('main section a[href^="/labtestmean?id="] h3')
    .first()
    .innerText();
  const query = firstCardText.slice(0, Math.min(3, firstCardText.length));

  await page
    .getByPlaceholder("Search lab test means, references, managers…")
    .fill(query);

  const after = await readCount(page);
  expect(after.shown).toBeGreaterThan(0); // the source card itself must still match
  expect(after.shown).toBeLessThanOrEqual(before.total);

  const firstResult = page
    .locator('main section a[href^="/labtestmean?id="] h3')
    .first();
  await expect(firstResult).toContainText(new RegExp(query, "i"));
});
