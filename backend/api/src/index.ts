import express from 'express';
const app = express();
import { db } from "@openledger/db"


app.get('/health', async (req, res) => {
  try {
    const user = await db.user.create({
      data: {
        email: `siddhaartha+${Date.now()}@gmail.com`,
        name: "John Doe"
      }
    });
    res.json({ status: 'ok', user });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
});

app.listen(4000, () => {
  console.log('API running on port 4000');
});