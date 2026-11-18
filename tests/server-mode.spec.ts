import { expect, test } from "@playwright/test";

test("server mode badge stays hidden and install UI is shown when serverMode is false", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#serverModeBadge")).toBeHidden();

  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    };

    Object.defineProperty(event, "prompt", {
      value: () => Promise.resolve()
    });
    Object.defineProperty(event, "userChoice", {
      value: Promise.resolve({ outcome: "dismissed" })
    });

    window.dispatchEvent(event);
  });

  await expect(page.locator("#installPrompt")).toBeVisible();
  await expect(page.locator("#installButton")).toBeVisible();
  await expect(page.locator("#serverModeBadge")).toBeHidden();

  const appSettings = await page.evaluate(async () => {
    const response = await fetch("/appsettings.json", { cache: "no-store" });
    return response.json();
  });

  expect(appSettings.serverMode).toBe(false);
});

test("server mode badge is visible and install UI stays hidden when serverMode is true", async ({ page }) => {
  page.on("pageerror", (error) => console.error("BROWSER_ERROR:", error.message));

  await page.addInitScript(() => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("/appsettings.json")) {
        return Promise.resolve(new Response(JSON.stringify({ serverMode: true, defaultLanguage: "de" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }
      if (url.includes("/api/boards")) {
        return Promise.resolve(new Response(JSON.stringify({ boards: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }
      if (url.includes("/api/board")) {
        return Promise.resolve(new Response(JSON.stringify({ id: null, month: "2026-11", cells: Array(16).fill("") }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }));
      }
      return nativeFetch(input, init);
    };
  });

  await page.goto("/");

  await expect(page.locator("#serverModeBadge")).toBeVisible();
  await expect(page.locator("#installPrompt")).toBeHidden();
  await expect(page.locator("#installButton")).toBeHidden();
});

test("checkbox is disabled for empty text and completed state persists", async ({ page }) => {
  await page.goto("/");
  await page.locator("#newBoardButton").click();

  const firstText = page.locator(".cell-text").first();
  const firstCheckbox = page.locator(".cell-checkbox").first();

  await expect(firstCheckbox).toBeDisabled();
  await firstText.click();
  await firstText.fill("Wäsche waschen");
  await expect(firstCheckbox).toBeEnabled();
  await firstCheckbox.check();
  await expect(firstText).toHaveClass(/completed/);
  await page.locator("#saveButton").click();

  await page.reload();

  await expect(page.locator(".cell-text").first()).toHaveText("Wäsche waschen");
  await expect(page.locator(".cell-text").first()).toHaveClass(/completed/);
  await expect(page.locator(".cell-checkbox").first()).toBeChecked();
});
