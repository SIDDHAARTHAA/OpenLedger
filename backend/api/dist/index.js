import express from 'express';
const app = express();
app.get('/health', async (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(4000, () => {
    console.log('API running on port 4000');
});
//# sourceMappingURL=index.js.map