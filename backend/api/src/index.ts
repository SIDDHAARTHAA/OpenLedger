import { resolve } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import app from "./app.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(__dirname, "../../../.env"), override: false });

app.listen(4000, () => {
  console.log('API running on port 4000');
});
