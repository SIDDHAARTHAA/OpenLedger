import express, { type Request, type Response } from 'express';
import cors from 'cors';
import bankRoutes from './routes/bank.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bankRoutes);

app.get("/health", (req: Request, res: Response) => {
    res.send("Bank API running");
});

const port = Number(process.env.PORT ?? 8081);

app.listen(port, () => {
    console.log(`Bank api running on port ${port}`);
});
