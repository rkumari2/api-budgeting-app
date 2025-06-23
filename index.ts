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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
