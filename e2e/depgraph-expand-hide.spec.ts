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

test("hiding the only selected bench keeps its neighbours on the canvas", async ({
  page,
}) => {
  const rootNode = await selectFirstBenchAsRoot(page);
  const rootName = (await rootNode.innerText()).split("\n")[0].trim();
  test.skip(rootName.endsWith("..."), "Root label is truncated");

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

  const total = await page.locator(".react-flow__node").count();
  expect(total).toBeGreaterThan(1);

  // Hide the ONLY selected bench. This used to be refused outright.
  await page.locator(".react-flow__node").first().click({ button: "right" });
  const hideItem = menu.getByRole("menuitem", { name: "Hide" });
  await expect(hideItem).toBeEnabled();
  await hideItem.click();

  // Its card and chip are gone; every neighbour it brought in stays, even
  // though nothing is selected any more — hiding does not cascade.
  await expect(page.locator(".react-flow__node")).toHaveCount(total - 1);
  await expect(
    page.getByRole("button", { name: `Remove ${rootName}` }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Select a bench to start building a diagram."),
  ).toHaveCount(0);
});
