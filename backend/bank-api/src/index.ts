import express, { type Request, type Response } from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
// app.use(bankRoutes);

app.get("/health", (req: Request, res: Response) => {
    res.send("Bank API running");
});

app.listen(8081, () => {
    console.log("Bank api running on port 8081");
});