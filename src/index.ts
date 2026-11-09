import express from "express";
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const projectRoot = path.resolve(__dirname, "..");
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

async function initDatabase() {
  const tableExists = await get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'boards'"
  );

  if (!tableExists) {
    await run(`
      CREATE TABLE boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        cells TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    return;
  }

  const schemaSql = await get<{ sql: string | null }>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'boards'"
  );
  const indexSqlRows = await all<{ sql: string | null }>(
    "SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'boards'"
  );

  const schemaTexts = [schemaSql?.sql ?? "", ...indexSqlRows.map((row) => row.sql ?? "")];
  const hasLegacyMonthConstraint = schemaTexts.some((sql) => {
    const upperSql = (sql ?? "").toUpperCase();
    return upperSql.includes("UNIQUE") && upperSql.includes("MONTH");
  });

  if (hasLegacyMonthConstraint) {
    await run("ALTER TABLE boards RENAME TO boards_legacy");
    await run(`
      CREATE TABLE boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        cells TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    await run(`
      INSERT INTO boards (id, month, cells, updated_at)
      SELECT id, month, cells, updated_at FROM boards_legacy ORDER BY id
    `);
    await run("DROP TABLE boards_legacy");
  }
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

app.get("/api/boards", async (_, res) => {
  try {
    const rows = await all<{ id: number; month: string; cells: string }>(
      "SELECT id, month, cells FROM boards ORDER BY month DESC, id DESC"
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
    res.status(500).json({ message: "Monatsübersicht konnte nicht geladen werden." });
  }
});

app.get("/api/board", async (req, res) => {
  const id = typeof req.query.id === "string" ? Number(req.query.id) : undefined;
  const month = typeof req.query.month === "string" ? req.query.month : new Date().toISOString().slice(0, 7);

  const row = id
    ? ((await get<{ id: number; month: string; cells: string }>(
        "SELECT id, month, cells FROM boards WHERE id = ?",
        [id]
      )) as { id: number; month: string; cells: string } | undefined)
    : ((await get<{ id: number; month: string; cells: string }>(
        "SELECT id, month, cells FROM boards WHERE month = ? ORDER BY id DESC LIMIT 1",
        [month]
      )) as { id: number; month: string; cells: string } | undefined);

  if (!row) {
    res.json({ id: null, month, cells: Array(16).fill("") });
    return;
  }

  try {
    const cells = JSON.parse(row.cells) as unknown;
    res.json({ id: row.id, month: row.month, cells: normalizeCells(cells) });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Laden des Boards." });
  }
});

app.post("/api/board", async (req, res) => {
  const { id, month, cells } = req.body as { id?: number | string; month?: string; cells?: unknown };

  if (typeof month !== "string" || !month) {
    res.status(400).json({ message: "Monat fehlt." });
    return;
  }

  const normalizedCells = normalizeCells(cells);

  if (id !== undefined && id !== null && id !== "") {
    const boardId = Number(id);
    await run(
      "UPDATE boards SET cells = ?, updated_at = ? WHERE id = ?",
      [JSON.stringify(normalizedCells), new Date().toISOString(), boardId]
    );

    res.json({ id: boardId, month, cells: normalizedCells });
    return;
  }

  const insertedId = await run(
    "INSERT INTO boards (month, cells, updated_at) VALUES (?, ?, ?)",
    [month, JSON.stringify(normalizedCells), new Date().toISOString()]
  );

  res.json({ id: insertedId, month, cells: normalizedCells });
});

app.delete("/api/board", async (req, res) => {
  const id = typeof req.query.id === "string" ? Number(req.query.id) : undefined;
  const month = typeof req.query.month === "string" ? req.query.month : undefined;

  if (id !== undefined && Number.isFinite(id)) {
    await run("DELETE FROM boards WHERE id = ?", [id]);
    res.json({ id, deleted: true });
    return;
  }

  if (!month) {
    res.status(400).json({ message: "Monat fehlt." });
    return;
  }

  await run("DELETE FROM boards WHERE month = ?", [month]);
  res.json({ month, deleted: true });
});

app.get("*", (_, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

(async () => {
  try {
    await initDatabase();
    app.listen(port, () => {
      console.log(`Month Bingo app läuft auf http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Datenbank konnte nicht initialisiert werden:", error);
    process.exit(1);
  }
})();
