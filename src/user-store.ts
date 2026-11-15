import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

export const USER_COOKIE_NAME = "month-bingo-user-id";

export function getUserIdFromCookieHeader(cookieHeader?: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName !== USER_COOKIE_NAME || rawValue.length === 0) {
      continue;
    }

    return decodeURIComponent(rawValue.join("="));
  }

  return undefined;
}

export function getOrCreateUserId(
  req: Pick<IncomingMessage, "headers">,
  res: Pick<ServerResponse, "getHeader" | "setHeader">
): string {
  const existingUserId = getUserIdFromCookieHeader(req.headers.cookie);
  if (existingUserId && existingUserId.trim()) {
    return existingUserId;
  }

  const newUserId = randomUUID();
  const cookieValue = `${USER_COOKIE_NAME}=${newUserId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`;
  const currentCookies = typeof res.getHeader === "function" ? res.getHeader("Set-Cookie") : undefined;
  const cookies = Array.isArray(currentCookies)
    ? currentCookies.map(String)
    : currentCookies
      ? [String(currentCookies)]
      : [];

  cookies.push(cookieValue);

  if (typeof res.setHeader === "function") {
    res.setHeader("Set-Cookie", cookies);
  }

  return newUserId;
}

export function getUserIdFromRequest(
  req: Pick<IncomingMessage, "headers">,
  res: Pick<ServerResponse, "getHeader" | "setHeader">
): string {
  return getOrCreateUserId(req, res);
}
