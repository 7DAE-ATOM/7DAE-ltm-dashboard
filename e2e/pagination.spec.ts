import { test, expect } from "@playwright/test";
import { pinDensity } from "./utils";

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  // Pin a small page (3×2 = 6) so a modest dataset still produces more than
  // one page; at the 5×5 default this suite would just skip.
  await pinDensity(page, { columns: 3, rows: 2 });
  await page.goto("/");
  await expect(
    page.getByPlaceholder("Search lab test means, references, managers…"),
  ).toBeVisible();
});

test("page 2 shows different items and updates the URL, page 1 has no query param", async ({
  page,
}) => {
  const nav = page.getByRole("navigation", { name: "Pagination" });
  test.skip((await nav.count()) === 0, "Not enough results for pagination to render");

  const page2Button = nav.getByRole("button", { name: "Go to page 2" });
  test.skip((await page2Button.count()) === 0, "Fewer than 2 pages of results");

  const firstPageNames = await page
    .locator('main section a[href^="/labtestmean?id="] h3')
    .allInnerTexts();

  await page2Button.click();
  await expect(page).toHaveURL(/\?page=2\b/);
  await expect(nav.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  const secondPageNames = await page
    .locator('main section a[href^="/labtestmean?id="] h3')
    .allInnerTexts();
  expect(secondPageNames).not.toEqual(firstPageNames);

  await nav.getByRole("button", { name: "Go to page 1" }).click();
  await expect(page).not.toHaveURL(/\?page=/);
});
