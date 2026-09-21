import { test, expect } from "@playwright/test";
import { selectFirstBenchAsRoot } from "./utils";

test.use({ viewport: { width: 1440, height: 900 } });

test("right-click expand adds a connected node, then Hide removes it", async ({ page }) => {
  const rootNode = await selectFirstBenchAsRoot(page);
  await rootNode.click({ button: "right" });

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();

  // The root can be a plain bench (3 possible expand actions) or a shared
  // resource (1 "Usable by" action) — try whichever is enabled first.
  const candidates = [
    "Show depends on",
    "Show supports",
    "Show shared resources",
    "Usable by",
  ];
  let expanded = false;
  for (const name of candidates) {
    const item = menu.getByRole("menuitem", { name });
    if ((await item.count()) > 0 && (await item.isEnabled())) {
      await item.click();
      expanded = true;
      break;
    }
  }
  test.skip(!expanded, "Root bench has no expandable relations right now");

  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);

  // The two nodes must not land on the exact same position — a direct
  // regression check for the node-overlap bug fixed via `gapX`.
  const boxes = await page.locator(".react-flow__node").evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y };
    }),
  );
  expect(boxes[0]).not.toEqual(boxes[1]);

  const addedNode = page.locator(".react-flow__node").nth(1);
  await addedNode.click({ button: "right" });
  await expect(menu).toBeVisible();
  const hideItem = menu.getByRole("menuitem", { name: "Hide" });
  await expect(hideItem).toBeEnabled();
  await hideItem.click();

  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
});

test("a selected bench can be hidden, which drops its chip but keeps its neighbours", async ({
  page,
}) => {
  const rootNode = await selectFirstBenchAsRoot(page);
  const rootName = (await rootNode.innerText()).split("\n")[0].trim();
  test.skip(rootName.endsWith("..."), "Root label is truncated");

  // Bring in a neighbour, then promote it so there are TWO selected benches:
  // hiding is refused on the last remaining selection, since emptying it
  // would unmount the whole diagram.
  await rootNode.click({ button: "right" });
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  let expanded = false;
  for (const name of [
    "Show depends on",
    "Show supports",
    "Show shared resources",
    "Usable by",
  ]) {
    const item = menu.getByRole("menuitem", { name });
    if ((await item.count()) > 0 && (await item.isEnabled())) {
      await item.click();
      expanded = true;
      break;
    }
  }
  test.skip(!expanded, "Root bench has no expandable relations right now");
  await expect(page.locator(".react-flow__node")).toHaveCount(2);

  const neighbourName = (
    await page.locator(".react-flow__node").nth(1).innerText()
  )
    .split("\n")[0]
    .trim();
  test.skip(neighbourName.endsWith("..."), "Neighbour label is truncated");

  const combobox = page.getByRole("combobox", { name: "Select a bench" });
  await combobox.click();
  await combobox.fill(neighbourName);
  const option = page.getByRole("option").first();
  test.skip((await option.count()) === 0, "Neighbour not searchable by label");
  await option.click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);

  // Hide the ROOT. It used to be refused outright.
  await page.locator(".react-flow__node").first().click({ button: "right" });
  const hideItem = menu.getByRole("menuitem", { name: "Hide" });
  await expect(hideItem).toBeEnabled();
  await hideItem.click();

  // The card and its chip are gone; the neighbour stays put — hiding does
  // not cascade, unlike removing a bench from its chip.
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: `Remove ${rootName}` }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: `Remove ${neighbourName}` }),
  ).toHaveCount(1);
});
