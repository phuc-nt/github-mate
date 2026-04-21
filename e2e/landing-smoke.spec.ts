import { expect, test } from "@playwright/test";

test.describe("landing smoke", () => {
  test("renders landing form with 2 URL inputs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("https://github.com/alice")).toBeVisible();
    await expect(page.getByPlaceholder("https://github.com/bob")).toBeVisible();
    await expect(page.getByRole("button", { name: /match/i })).toBeVisible();
  });

  test("top 20 page renders leaderboard heading", async ({ page }) => {
    await page.goto("/top20");
    await expect(
      page.getByRole("heading", { name: /top 20 trending authors/i }),
    ).toBeVisible();
  });

  test("header nav includes Home and Top 20 links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /home/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /top 20/i })).toBeVisible();
  });
});
