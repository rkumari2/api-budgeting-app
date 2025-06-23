import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(__dirname, "budget.db");
const db = new Database(dbPath);

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    date TEXT NOT NULL
  )
`
).run();

const count = (
  db.prepare("SELECT COUNT(*) AS count FROM transactions").get() as {
    count: number;
  }
).count;

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO transactions (id, amount, category, note, type, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const fakeTransactions = [
    [
      "1",
      1500,
      "Salary",
      "Monthly paycheck",
      "income",
      "2025-06-01T10:00:00.000Z",
    ],
    [
      "2",
      200,
      "Groceries",
      "Weekly shopping",
      "expense",
      "2025-06-02T15:30:00.000Z",
    ],
    ["3", 50, "Transport", "Bus ticket", "expense", "2025-06-03T08:45:00.000Z"],
    [
      "4",
      300,
      "Freelance",
      "Project payment",
      "income",
      "2025-06-05T12:00:00.000Z",
    ],
    [
      "5",
      100,
      "Entertainment",
      "Concert ticket",
      "expense",
      "2025-06-06T20:00:00.000Z",
    ],
  ];

  const insertMany = db.transaction((transactions: any[]) => {
    for (const tx of transactions) insert.run(...tx);
  });

  insertMany(fakeTransactions);
}

export default db;
