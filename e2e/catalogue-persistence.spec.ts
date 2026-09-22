import { test, expect, type Page } from "@playwright/test";
import { openSection } from "./utils";

test.use({ viewport: { width: 1440, height: 900 } });

const COUNT_RE = /(\d+)\s*\/\s*(\d+)\s*lab test means/;

async function readCountText(page: Page): Promise<string> {
  return page.getByText(COUNT_RE).innerText();
}

async function applyPhotoFilter(page: Page): Promise<void> {
  await openSection(page, "Photo");
  await page
    .getByRole("radiogroup", { name: "Photo filter" })
    .getByRole("radio", { name: "With photo" })
    .click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByPlaceholder("Search lab test means, references, managers…"),
  ).toBeVisible();
});

test("filters survive navigating to a detail page and back", async ({ page }) => {
  await applyPhotoFilter(page);
  const filteredCount = await readCountText(page);

  const cards = page.locator('main section a[href^="/labtestmean?id="]');
  test.skip((await cards.count()) === 0, "No results to open under this filter");

  await cards.first().click();
  await expect(page).toHaveURL(/\/labtestmean\?id=/);

  await page.goBack();
  await expect(
    page.getByPlaceholder("Search lab test means, references, managers…"),
  ).toBeVisible();
  await expect(page.getByText(COUNT_RE)).toHaveText(filteredCount);
});

/* The Catalogue nav link used to call `resetCatalogueFilters()`. It no longer
 * does: the selection is shared with /map and /depview, so wiping it on a nav
 * click would silently throw away what the other two tabs are showing. */
test("the Catalogue nav link keeps the current filters", async ({ page }) => {
  await applyPhotoFilter(page);
  const filteredCount = await readCountText(page);

  await page.getByRole("link", { name: "Catalogue" }).click();
  await expect(
    page.getByPlaceholder("Search lab test means, references, managers…"),
  ).toBeVisible();

  await expect(page.getByText(COUNT_RE)).toHaveText(filteredCount);
});

test("Clear All empties every axis", async ({ page }) => {
  await applyPhotoFilter(page);

  await page.getByRole("button", { name: "Clear All" }).click();

  const resetText = await readCountText(page);
  const [, resetShown, resetTotal] = COUNT_RE.exec(resetText)!;
  expect(resetShown).toBe(resetTotal); // no filter active => shown === total
  // Nothing left to clear, so the link takes itself away.
  await expect(page.getByRole("button", { name: "Clear All" })).toHaveCount(0);
});

test("filters survive moving between Catalogue, Map and Dependency View", async ({
  page,
}) => {
  await applyPhotoFilter(page);
  const filteredCount = await readCountText(page);

  await page.getByRole("link", { name: "Map" }).click();
  await expect(page).toHaveURL(/\/map/);
  await expect(page.getByText(COUNT_RE)).toHaveText(filteredCount);

  await page.getByRole("link", { name: "Dependency View" }).click();
  await expect(page).toHaveURL(/\/depview/);
  await expect(page.getByText(COUNT_RE)).toHaveText(filteredCount);

  await page.getByRole("link", { name: "Catalogue" }).click();
  await expect(page.getByText(COUNT_RE)).toHaveText(filteredCount);
});

test("a folded chapter stays folded across pages and reloads", async ({ page }) => {
  // Open it, so that "folded" is a state this test actually set.
  await openSection(page, "Country");
  const header = page.getByRole("button", { name: "Country", exact: true });
  await header.click();
  await expect(header).toHaveAttribute("aria-expanded", "false");

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Country", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");

  await page.getByRole("link", { name: "Map" }).click();
  await expect(
    page.getByRole("button", { name: "Country", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
});
