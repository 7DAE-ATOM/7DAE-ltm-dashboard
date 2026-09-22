import { test, expect } from "@playwright/test";
import { selectFirstBenchAsRoot } from "./utils";

test.use({ viewport: { width: 1440, height: 900 } });

const EXPAND = "Expand the selected lab test means list";

test("the magnifier opens the selection at full width, with its count", async ({
  page,
}) => {
  await selectFirstBenchAsRoot(page);

  const trigger = page.getByRole("button", { name: EXPAND });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog", {
    name: /Selected lab test means/,
  });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Selected lab test means (1)");
});

test("clicking a chip's remove button does not dismiss the dialog", async ({
  page,
}) => {
  await selectFirstBenchAsRoot(page);
  await page.getByRole("button", { name: EXPAND }).click();

  const dialog = page.getByRole("dialog", { name: /Selected lab test means/ });
  // A click inside the panel must not reach the backdrop's close handler.
  await dialog.getByRole("heading").click();
  await expect(dialog).toBeVisible();
});

test("removing the last bench from the dialog closes it and empties the graph", async ({
  page,
}) => {
  await selectFirstBenchAsRoot(page);
  await expect(page.locator(".react-flow__node")).toHaveCount(1);

  await page.getByRole("button", { name: EXPAND }).click();
  const dialog = page.getByRole("dialog", { name: /Selected lab test means/ });
  await dialog.getByRole("button", { name: /^Remove / }).click();

  // The bar unmounts with an empty selection, taking the dialog with it.
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: EXPAND })).toHaveCount(0);
  await expect(page.locator(".react-flow__node")).toHaveCount(0);
});

test("Escape and the close button both dismiss the dialog", async ({ page }) => {
  await selectFirstBenchAsRoot(page);
  const trigger = page.getByRole("button", { name: EXPAND });
  const dialog = page.getByRole("dialog", { name: /Selected lab test means/ });

  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await trigger.click();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);
  // The selection itself is untouched by opening and closing.
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
});
