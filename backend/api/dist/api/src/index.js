import express from 'express';
const app = express();
import { db } from "@openledger/db";
app.get('/health', async (req, res) => {
    const user = await db.user.create({
        data: {
            email: "[EMAIL_ADDRESS]",
            name: "John Doe"
        }
    });
    res.json({ status: 'ok' });
});
app.listen(4000, () => {
    console.log('API running on port 4000');
});
//# sourceMappingURL=index.js.map