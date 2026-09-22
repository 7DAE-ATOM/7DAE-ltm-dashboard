import { test, expect, type Page, type Locator } from "@playwright/test";

/** Filter chapters are folded on first visit and their bodies are hidden with
 * the native `hidden` attribute, so anything inside has to be revealed before
 * it can be clicked. Idempotent: already-open chapters are left alone. */
export async function openSection(page: Page, label: string): Promise<void> {
  const header = page.getByRole("button", { name: label, exact: true });
  await expect(header).toBeVisible();
  if ((await header.getAttribute("aria-expanded")) !== "true") {
    await header.click();
    await expect(header).toHaveAttribute("aria-expanded", "true");
  }
}

/** Pins the catalogue's grid density *before* the page loads, so the inline
 * anti-FOUC script in `app/layout.tsx` — which reads this very key — already
 * applies it on the first paint. Without it, tests would be at the mercy of
 * the 5×5 default. */
export async function pinDensity(
  page: Page,
  density: { columns: number; rows: number | "all" },
): Promise<void> {
  await page.addInitScript((d) => {
    try {
      globalThis.localStorage.setItem("catalogue-density", JSON.stringify(d));
    } catch {
      // Storage blocked — the test will just run at the default density.
    }
  }, density);
}

/** Opens `/depgraph`, selects the first combobox result as the graph's root
 * node, and returns its `.react-flow__node` locator. Skips the test if the
 * backend returned no benches to pick from. */
export async function selectFirstBenchAsRoot(page: Page): Promise<Locator> {
  await page.goto("/depgraph");
  const combobox = page.getByRole("combobox", { name: "Select a bench" });
  await expect(combobox).toBeVisible();
  await combobox.click();
  const options = page.getByRole("option");
  test.skip((await options.count()) === 0, "No benches returned by the backend");
  await options.first().click();
  const node = page.locator(".react-flow__node").first();
  await expect(node).toBeVisible();
  return node;
}
