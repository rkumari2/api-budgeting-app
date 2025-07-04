import cors from "cors";
import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "./db";
import { Transaction } from "./types";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/transactions", (req: Request, res: Response) => {
  const rows: Transaction[] = db
    .prepare("SELECT * FROM transactions ORDER BY date DESC")
    .all() as Transaction[];
  res.json(rows);
});

app.get("/api/transactions/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const row: Transaction | undefined = db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .get(id) as Transaction | undefined;

  if (row) {
    res.json(row);
  } else {
    res.status(404).json({ error: "Transaction not found" });
  }
});

app.get("/api/transactions/month/:month", (req: Request, res: Response) => {
  const month = req.params.month;
  try {
    const rows = db
      .prepare(
        `
        SELECT * FROM transactions
        WHERE strftime('%Y-%m', date) = ?
        ORDER BY date DESC
      `
      )
      .all(month) as Transaction[];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions by month" });
  }
});

app.get("/api/transactions/date/:date", (req: Request, res: Response) => {
  const date = req.params.date;

  try {
    const rows: Transaction[] = db
      .prepare(
        `
        SELECT * FROM transactions
        WHERE date LIKE ?
        ORDER BY date DESC
      `
      )
      .all(`${date}%`) as Transaction[];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions by date" });
  }
});

app.get(
  "/api/transactions/category/:category",
  (req: Request, res: Response) => {
    const category = req.params.category;

    try {
      const rows: Transaction[] = db
        .prepare(
          `
        SELECT * FROM transactions
        WHERE LOWER(category) = LOWER(?)
        ORDER BY date DESC
      `
        )
        .all(category) as Transaction[];

      res.json(rows);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to fetch transactions by category" });
    }
  }
);

app.post("/api/transactions", (req: Request, res: Response) => {
  const { amount, category, note, type, date } = req.body;

  if (!amount || !category || !type || !date) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (!["income", "expense"].includes(type)) {
    res.status(400).json({ error: "Invalid type (must be income or expense)" });
    return;
  }

  const id = uuidv4();

  try {
    db.prepare(
      `
      INSERT INTO transactions (id, amount, category, note, type, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(id, amount, category, note, type, date);

    const newTransaction: Transaction = {
      id,
      amount,
      category,
      note,
      type,
      date,
    };
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error("Failed to insert transaction:", err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.delete("/api/transactions/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const result = db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
  if (result.changes) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Transaction not found" });
  }
});

app.patch("/api/transactions/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, category, note, type, date } = req.body;

  const existing = db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .get(id) as Transaction | undefined;

  if (!existing) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const updatedTransaction: Transaction = {
    id,
    amount: amount !== undefined ? amount : existing.amount,
    category: category !== undefined ? category : existing.category,
    note: note !== undefined ? note : existing.note,
    type: type !== undefined ? type : existing.type,
    date: date !== undefined ? date : existing.date,
  };

  try {
    db.prepare(
      `
      UPDATE transactions
      SET amount = ?, category = ?, note = ?, type = ?, date = ?
      WHERE id = ?
    `
    ).run(
      updatedTransaction.amount,
      updatedTransaction.category,
      updatedTransaction.note,
      updatedTransaction.type,
      updatedTransaction.date,
      id
    );

    res.json(updatedTransaction);
  } catch (err) {
    console.error("Failed to patch transaction:", err);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
