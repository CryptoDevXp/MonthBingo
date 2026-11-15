import express from "express";
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";

import { getUserIdFromRequest } from "./user-store";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const app = express();
const port = Number(process.env.PORT ?? 3001);
const projectRoot = path.resolve(process.cwd());
const dataDir = path.join(projectRoot, "data");
const dbPath = path.join(dataDir, "month-bingo.db");
const publicDir = path.join(projectRoot, "public");

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

const run = (sql: string, params: unknown[] = []): Promise<number> =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) {
        reject(error);
        return;
      }
      resolve(this.lastID ?? 0);
    });
  });

const get = <T>(sql: string, params: unknown[] = []): Promise<T | undefined> =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve((row as T | undefined) ?? undefined);
    });
  });

const all = <T>(sql: string, params: unknown[] = []): Promise<T[]> =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve((rows as T[]) ?? []);
    });
  });

const normalizeCells = (cells: unknown): string[] => {
  const safeArray = Array.isArray(cells) ? cells : [];
  return Array.from({ length: 16 }, (_, index) => {
    const value = safeArray[index];
    return typeof value === "string" ? value : "";
  });
};

let databaseReady: Promise<void> | undefined;

const ensureDatabaseReady = async () => {
  if (!databaseReady) {
    databaseReady = initDatabase();
  }

  await databaseReady;
};

async function initDatabase() {
  const tableExists = await get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'boards'"
  );

  if (!tableExists) {
    await run(`
      CREATE TABLE boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        month TEXT NOT NULL,
        cells TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    return;
  }

  const columns = await all<{ name: string }>("PRAGMA table_info(boards)");
  const columnNames = new Set(columns.map((column) => column.name));
  const requiredEnglishColumns = ["id", "user_id", "month", "cells", "updated_at"];
  const hasEnglishSchema = requiredEnglishColumns.every((columnName) => columnNames.has(columnName));

  if (!hasEnglishSchema) {
    await run("ALTER TABLE boards RENAME TO boards_legacy");
    await run(`
      CREATE TABLE boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        month TEXT NOT NULL,
        cells TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    const currentColumns = await all<{ name: string }>("PRAGMA table_info(boards_legacy)");
    const legacyColumnNames = new Set(currentColumns.map((column) => column.name));
    const userColumn = legacyColumnNames.has("user_id") ? "user_id" : legacyColumnNames.has("benutzer_id") ? "benutzer_id" : "'legacy-user'";
    const monthColumn = legacyColumnNames.has("month") ? "month" : legacyColumnNames.has("monat") ? "monat" : "''";
    const cellsColumn = legacyColumnNames.has("cells") ? "cells" : legacyColumnNames.has("zellen") ? "zellen" : "'[]'";
    const updatedAtColumn = legacyColumnNames.has("updated_at") ? "updated_at" : legacyColumnNames.has("aktualisiert_am") ? "aktualisiert_am" : "datetime('now')";

    await run(`
      INSERT INTO boards (id, user_id, month, cells, updated_at)
      SELECT id,
             ${userColumn},
             ${monthColumn},
             ${cellsColumn},
             ${updatedAtColumn}
      FROM boards_legacy ORDER BY id
    `);
    await run("DROP TABLE boards_legacy");
  }
}

app.use(express.json({ limit: "1mb" }));
app.use(async (req, res, next) => {
  try {
    await ensureDatabaseReady();
    req.userId = getUserIdFromRequest(req, res);
    next();
  } catch (error) {
    next(error);
  }
});
app.use(express.static(publicDir));

app.get("/appsettings.json", (_, res) => {
  res.sendFile(path.join(projectRoot, "appsettings.json"));
});

app.get("/api/boards", async (req, res) => {
  try {
    const userId = req.userId ?? getUserIdFromRequest(req, res);
    const rows = await all<{ id: number; month: string; cells: string }>(
      "SELECT id, month, cells FROM boards WHERE user_id = ? ORDER BY month DESC, id DESC",
      [userId]
    );

    const boards = rows.map((row) => {
      try {
        return { id: row.id, month: row.month, cells: normalizeCells(JSON.parse(row.cells)) };
      } catch {
        return { id: row.id, month: row.month, cells: Array(16).fill("") };
      }
    });

    res.json({ boards });
  } catch (error) {
    res.status(500).json({ message: "Could not load the board overview." });
  }
});

app.get("/api/board", async (req, res) => {
  const userId = req.userId ?? getUserIdFromRequest(req, res);
  const id = typeof req.query.id === "string" ? Number(req.query.id) : undefined;
  const month = typeof req.query.month === "string" ? req.query.month : new Date().toISOString().slice(0, 7);

  const row = id
    ? ((await get<{ id: number; month: string; cells: string }>(
        "SELECT id, month, cells FROM boards WHERE id = ? AND user_id = ?",
        [id, userId]
      )) as { id: number; month: string; cells: string } | undefined)
    : ((await get<{ id: number; month: string; cells: string }>(
        "SELECT id, month, cells FROM boards WHERE user_id = ? AND month = ? ORDER BY id DESC LIMIT 1",
        [userId, month]
      )) as { id: number; month: string; cells: string } | undefined);

  if (!row) {
    res.json({ id: null, month, cells: Array(16).fill("") });
    return;
  }

  try {
    const cells = JSON.parse(row.cells) as unknown;
    res.json({ id: row.id, month: row.month, cells: normalizeCells(cells) });
  } catch (error) {
    res.status(500).json({ message: "Error loading the board." });
  }
});

app.post("/api/board", async (req, res) => {
  const userId = req.userId ?? getUserIdFromRequest(req, res);
  const { id, month, cells } = req.body as { id?: number | string; month?: string; cells?: unknown };

  if (typeof month !== "string" || !month) {
    res.status(400).json({ message: "Month is required." });
    return;
  }

  const normalizedCells = normalizeCells(cells);

  if (id !== undefined && id !== null && id !== "") {
    const boardId = Number(id);
    await run(
      "UPDATE boards SET cells = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      [JSON.stringify(normalizedCells), new Date().toISOString(), boardId, userId]
    );

    res.json({ id: boardId, month, cells: normalizedCells });
    return;
  }

  const insertedId = await run(
    "INSERT INTO boards (user_id, month, cells, updated_at) VALUES (?, ?, ?, ?)",
    [userId, month, JSON.stringify(normalizedCells), new Date().toISOString()]
  );

  res.json({ id: insertedId, month, cells: normalizedCells });
});

app.delete("/api/board", async (req, res) => {
  const userId = req.userId ?? getUserIdFromRequest(req, res);
  const id = typeof req.query.id === "string" ? Number(req.query.id) : undefined;
  const month = typeof req.query.month === "string" ? req.query.month : undefined;

  if (id !== undefined && Number.isFinite(id)) {
    await run("DELETE FROM boards WHERE id = ? AND user_id = ?", [id, userId]);
    res.json({ id, deleted: true });
    return;
  }

  if (!month) {
    res.status(400).json({ message: "Month is required." });
    return;
  }

  await run("DELETE FROM boards WHERE user_id = ? AND month = ?", [userId, month]);
  res.json({ month, deleted: true });
});

app.get("*", (_, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;

if (!process.env.VERCEL) {
  (async () => {
    try {
      await ensureDatabaseReady();
      app.listen(port, () => {
        console.log(`Month Bingo app is running at http://localhost:${port}`);
      });
    } catch (error) {
      console.error("Database could not be initialized:", error);
      process.exit(1);
    }
  })();
}
