import express from "express";

export default function topicsApi(db) {
  const router = express.Router();

  // ✅ Test GET
  router.get("/", (req, res) => {
    res.json({
      message: "✅ Topics API works (GET)",
      note: "Use POST to fetch topics by language",
    });
  });

  // ✅ POST: fetch topics from both collections by lang
  router.post("/", async (req, res) => {
    try {
      if (!db) {
        console.error("❌ Firestore DB not initialized");
        return res.status(500).json({ topics: [], error: "Firestore not initialized" });
      }

      const lang = req.body.lang || "en";
      const collections = ["topics", "topics2"];
      let topics = [];

      for (const col of collections) {
        const snapshot = await db
          .collection(col)
          .where("lang", "==", lang)
          .get();

        if (!snapshot.empty) {
          topics = topics.concat(snapshot.docs.map(doc => doc.data()));
        }
      }

      // ✅ Always return object { topics: [...] }
      res.json({ topics });

    } catch (err) {
      console.error("🔥 /api/topics error:", err);
      res.status(500).json({ topics: [], error: err.message });
    }
  });

  return router;
}
