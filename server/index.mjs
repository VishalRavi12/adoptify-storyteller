import dotenv from "dotenv";
import { createApp } from "./app.mjs";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(
    `Adoptify API listening on http://localhost:${PORT}`
  );
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY is missing.");
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is missing.");
  }
});
