import express from 'express'
import cookieParser from 'cookie-parser';
import routes from "./routes/routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api", routes);

app.get("/health", (req: any, res: any) => {
    return res.json("Healthy");
})

export default app;