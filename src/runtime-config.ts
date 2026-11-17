import fs from "fs";
import path from "path";

export type DatabaseMode = "private" | "public";

export type RuntimeSettings = {
  serverMode: boolean;
  databaseMode: DatabaseMode;
  defaultLanguage: string;
};

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  serverMode: false,
  databaseMode: "private",
  defaultLanguage: "de"
};

export const isServerModeEnabled = (settings: unknown): boolean => {
  if (!settings || typeof settings !== "object") {
    return false;
  }

  const value = (settings as { serverMode?: unknown }).serverMode;
  return value === true || String(value).toLowerCase() === "true";
};

export const isPublicDatabaseMode = (settings: unknown): boolean => {
  if (!settings || typeof settings !== "object") {
    return false;
  }

  const value = (settings as { databaseMode?: unknown }).databaseMode;
  return typeof value === "string" && value.toLowerCase() === "public";
};

export const loadRuntimeSettings = (projectRoot = process.cwd()): RuntimeSettings => {
  const settingsPath = path.join(projectRoot, "appsettings.json");

  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    return {
      serverMode: isServerModeEnabled(parsed),
      databaseMode: isPublicDatabaseMode(parsed) ? "public" : "private",
      defaultLanguage:
        parsed && typeof parsed === "object" && typeof (parsed as { defaultLanguage?: unknown }).defaultLanguage === "string"
          ? (parsed as { defaultLanguage: string }).defaultLanguage
          : DEFAULT_RUNTIME_SETTINGS.defaultLanguage
    };
  } catch {
    return DEFAULT_RUNTIME_SETTINGS;
  }
};
