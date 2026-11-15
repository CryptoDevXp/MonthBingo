import test from "node:test";
import assert from "node:assert/strict";

import { getUserIdFromCookieHeader, getOrCreateUserId } from "./user-store";

test("reads the user id from the cookie header", () => {
  const cookieHeader = "month-bingo-user-id=user-123; other=value";

  assert.equal(getUserIdFromCookieHeader(cookieHeader), "user-123");
});

test("creates a new user id and sets the cookie when no user id is present", () => {
  const req = { headers: {} } as any;
  const res = {
    getHeader: () => undefined,
    setHeader: (key: string, value: string | string[]) => {
      assert.equal(key, "Set-Cookie");
      const cookieList = Array.isArray(value) ? value : [value];
      assert.ok(cookieList.some((entry) => entry.startsWith("month-bingo-user-id=")));
    }
  } as any;

  const userId = getOrCreateUserId(req, res);

  assert.match(userId, /^[0-9a-f-]{36}$/);
});
