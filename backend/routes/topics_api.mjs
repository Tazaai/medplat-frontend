import express from "express";

export default function (db) {
  const router = express.Router();
  const allowedOrigin = "https://medplat-frontend-139218747785.europe-west1.run.app";

  router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  router.get("/", async (req, res) => {
    const area = req.query.area || "EM";
    const col = area === "EM" ? "topics" : "topics2";
    if (!db) return res.status(500).json({ error: "Firestore not initialized" });
    const snapshot = await db.collection(col).get();
    const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(topics);
  });

  return router;
}
