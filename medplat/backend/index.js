import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import topicsApi from "./routes/topics_api.mjs";
import dialogApi from "./routes/dialog_api.mjs";

// ✅ Load environment variables
dotenv.config();

// ✅ Setup Express
const app = express();

// ✅ Correct CORS: allow all or your frontend origin
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ Firebase setup
const serviceAccountPath = "./backend/serviceAccountKey.json";
let serviceAccount = null;

if (!fs.existsSync(serviceAccountPath)) {
  console.warn("❗ Secret not found at " + serviceAccountPath);
} else {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("✅ Firebase initialized");
  } catch (e) {
    console.error("❌ Firebase init error:", e.message);
  }
}

const db = admin.apps.length ? admin.firestore() : null;
if (!db) {
  console.warn("⚠️ Firestore DB not initialized.");
}

// ✅ Routes
app.get("/", (req, res) => {
  console.log("✅ Received GET /");
  res.send("Backend is working!");
});

app.use("/api/topics", topicsApi(db));
app.use("/api/dialog", dialogApi);

// ✅ Start server
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${port}`);
});
