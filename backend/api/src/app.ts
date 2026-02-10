import express from 'express'
import cookieParser from 'cookie-parser';
import routes from "./routes/routes.js";

const app = express();

import cors from "cors";

app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);


app.use(express.json());
app.use(cookieParser());
app.use("/api", routes);

app.get("/health", (req: any, res: any) => {
    return res.json("Healthy");
})

export default app;