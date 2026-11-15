import fs from "fs";
import path from "path";

export type RuntimeSettings = {
  serverMode: boolean;
  defaultLanguage: string;
};

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  serverMode: false,
  defaultLanguage: "de"
};

export const isServerModeEnabled = (settings: unknown): boolean => {
  if (!settings || typeof settings !== "object") {
    return false;
  }

  const value = (settings as { serverMode?: unknown }).serverMode;
  return value === true || String(value).toLowerCase() === "true";
};

export const loadRuntimeSettings = (projectRoot = process.cwd()): RuntimeSettings => {
  const settingsPath = path.join(projectRoot, "appsettings.json");

  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    return {
      serverMode: isServerModeEnabled(parsed),
      defaultLanguage:
        parsed && typeof parsed === "object" && typeof (parsed as { defaultLanguage?: unknown }).defaultLanguage === "string"
          ? (parsed as { defaultLanguage: string }).defaultLanguage
          : DEFAULT_RUNTIME_SETTINGS.defaultLanguage
    };
  } catch {
    return DEFAULT_RUNTIME_SETTINGS;
  }
};
