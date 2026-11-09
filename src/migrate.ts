import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";

const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, "data");
const dbPath = path.join(dataDir, "month-bingo.db");

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

const run = (sql: string, params: unknown[] = []): Promise<void> =>
  new Promise((resolve, reject) => {
    db.run(sql, params, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
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

async function migrateDatabase() {
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
    console.log("Migration abgeschlossen: Tabelle 'boards' wurde neu erstellt.");
    db.close();
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

  if (!hasLegacyMonthConstraint) {
    console.log("Migration nicht nötig: 'boards' hat bereits das neue Schema.");
    db.close();
    return;
  }

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

  console.log("Migration abgeschlossen: 'boards' wurde auf Mehrfach-Boards pro Monat migriert.");
  db.close();
}

migrateDatabase().catch((error) => {
  console.error("Migration fehlgeschlagen:", error);
  db.close();
  process.exit(1);
});
