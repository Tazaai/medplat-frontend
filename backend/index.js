import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import topicsApi from "./routes/topics_api.mjs";

dotenv.config();

const app = express();

const allowedOrigin = "https://medplat-frontend-139218747785.europe-west1.run.app";

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());

// === FIREBASE ===
const serviceAccountPath = "./backend/serviceAccountKey.json";
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase initialized");
} else {
  console.warn("❗ Service account key missing");
}

const db = admin.apps.length ? admin.firestore() : null;
if (!db) console.warn("⚠️ Firestore DB not initialized");

// === ROUTES ===
app.use("/api/topics", topicsApi(db));

app.get("/", (req, res) => {
  res.send("✅ Backend working!");
});

// === GPT handler ===
(async () => {
  try {
    const { default: generateCase } = await import("./generate_case_openai.mjs");

    app.post("/api/dialog", async (req, res) => {
      try {
        // ✅ Correct keys
        const topicInput = req.body.topicInput || "Sepsis";
        const niveau = req.body.niveau || "simpel";
        const lang = req.body.lang || "da";

        const gptRaw = await generateCase(topicInput, niveau, lang);

        let parsed;
        try {
          parsed = JSON.parse(gptRaw);
        } catch (err) {
          console.warn("⚠️ GPT returned invalid JSON, sending raw text");
          parsed = { aiReply: gptRaw };
        }

        res.json(parsed);
      } catch (error) {
        console.error("❌ Error in /api/dialog:", error);
        res.status(500).json({ error: error.message });
      }
    });

    const port = process.env.PORT || 8080;
    app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Backend running at http://0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error("❌ Cannot import generate_case_openai.mjs:", err);
  }
})();
