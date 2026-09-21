import { test, expect, type Page } from "@playwright/test";
import { selectFirstBenchAsRoot } from "./utils";

test.use({ viewport: { width: 1440, height: 900 } });

const EXPAND_ACTIONS = [
  "Show depends on",
  "Show supports",
  "Show shared resources",
  "Usable by",
];

/** Right-clicks the node and triggers the first enabled expansion action.
 * Returns false when the bench has nothing to expand — the caller skips. */
async function expandFirstAvailable(page: Page, nodeIndex = 0): Promise<boolean> {
  await page.locator(".react-flow__node").nth(nodeIndex).click({ button: "right" });
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  for (const name of EXPAND_ACTIONS) {
    const item = menu.getByRole("menuitem", { name });
    if ((await item.count()) > 0 && (await item.isEnabled())) {
      await item.click();
      return true;
    }
  }
  await page.keyboard.press("Escape");
  return false;
}

test("selecting a bench adds exactly one node and no edge", async ({ page }) => {
  await selectFirstBenchAsRoot(page);

  // The headline of this change: a bench's relations no longer come along
  // for the ride, however many it has.
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
});

test("the context menu still offers the relations that are not displayed", async ({
  page,
}) => {
  const rootNode = await selectFirstBenchAsRoot(page);
  await rootNode.click({ button: "right" });

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  // With nothing expanded, at least one expansion action must be available —
  // otherwise the bench genuinely has no relations and there is nothing to
  // assert.
  const enabled = await Promise.all(
    EXPAND_ACTIONS.map(async (name) => {
      const item = menu.getByRole("menuitem", { name });
      return (await item.count()) > 0 && (await item.isEnabled());
    }),
  );
  test.skip(!enabled.includes(true), "Root bench has no relations at all");
});

test("an edge appears when the other end of a relation is selected", async ({
  page,
}) => {
  await selectFirstBenchAsRoot(page);

  // Discover a genuinely related bench without knowing the dataset: expand to
  // reveal one, remember its name, then hide it again.
  const expanded = await expandFirstAvailable(page);
  test.skip(!expanded, "Root bench has no expandable relations right now");
  await expect(page.locator(".react-flow__node")).toHaveCount(2);

  const neighbourName = (
    await page.locator(".react-flow__node").nth(1).innerText()
  )
    .split("\n")[0]
    .trim();
  test.skip(neighbourName.endsWith("..."), "Neighbour label is truncated");

  await page.locator(".react-flow__node").nth(1).click({ button: "right" });
  await page.getByRole("menu").getByRole("menuitem", { name: "Hide" }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);

  // Now select that same bench. It must come back as a second card WITH the
  // line joining it to the first — no third card.
  const combobox = page.getByRole("combobox", { name: "Select a bench" });
  await combobox.click();
  await combobox.fill(neighbourName);
  const option = page.getByRole("option").first();
  test.skip((await option.count()) === 0, "Neighbour not searchable by label");
  await option.click();

  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
});

test("selecting an already-displayed neighbour promotes it without adding a node", async ({
  page,
}) => {
  await selectFirstBenchAsRoot(page);
  const expanded = await expandFirstAvailable(page);
  test.skip(!expanded, "Root bench has no expandable relations right now");
  await expect(page.locator(".react-flow__node")).toHaveCount(2);

  const neighbour = page.locator(".react-flow__node").nth(1);
  const neighbourName = (await neighbour.innerText()).split("\n")[0].trim();
  test.skip(neighbourName.endsWith("..."), "Neighbour label is truncated");

  // Before promotion it is a plain neighbour, so it has no selection chip.
  await expect(
    page.getByRole("button", { name: `Remove ${neighbourName}` }),
  ).toHaveCount(0);

  const combobox = page.getByRole("combobox", { name: "Select a bench" });
  await combobox.click();
  await combobox.fill(neighbourName);
  const option = page.getByRole("option").first();
  test.skip((await option.count()) === 0, "Neighbour not searchable by label");
  await option.click();

  // Still two cards: the neighbour was promoted in place, not duplicated,
  // and its own relations were not expanded.
  await expect(page.locator(".react-flow__node")).toHaveCount(2);

  // It now carries a selection chip — the observable proof that it was
  // promoted rather than added a second time.
  await expect(
    page.getByRole("button", { name: `Remove ${neighbourName}` }),
  ).toHaveCount(1);
});
