import cors from "cors";
import express, { Request, Response } from "express";
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
