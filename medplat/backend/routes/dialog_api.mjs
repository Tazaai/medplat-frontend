// backend/routes/dialog_api.mjs
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

// === OpenAI init ===
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// === Express Router ===
const router = express.Router();
router.use(cors({ origin: '*' }));
router.use(express.json());

// === Base Prompt ===
const basePrompt = `
Du er en AI-simulator for interaktive akutte patientcases. Du afslører aldrig diagnosen i starten.
Vent på at brugeren foreslår undersøgelser, vurderinger eller diagnoser.
Når brugeren skriver "Min vurdering er..." eller "Jeg tror det er...", skal du evaluere svaret og give feedback.
Brug venlig og klinisk relevant respons.
Hvis brugeren bestiller EKG, CT, thorax, Rtg, MR, svar med et billede (ingen fortolkning før brugeren beder om vurdering).
`;

// === Helper: Image detection ===
function findImageKeyword(text) {
  const lower = text.toLowerCase();
  if (lower.includes("ekg")) return "https://litfl.com/wp-content/uploads/2020/07/stemi-anterior-lbbb-ecg.jpg";
  if (lower.includes("ct") && lower.includes("le")) return "https://radiopaedia.org/images/56574267.jpg";
  if (lower.includes("ct")) return "https://www.radiologyassistant.nl/img/5ef21f35b8ef5";
  if (lower.includes("rtg") || lower.includes("thorax")) return "https://litfl.com/wp-content/uploads/2019/10/Chest-Xray.png";
  if (lower.includes("mr")) return "https://radiopaedia.org/images/25164369.jpg";
  return null;
}

function getDummyFindings() {
  return [
    { area: "Head", description: "No abnormal findings." },
    { area: "Neck", description: "Supple. No lymphadenopathy." },
    { area: "Chest", description: "Clear breath sounds. No rales or wheeze." },
  ];
}

// === ✅ Correct POST ===
router.post("/", async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: "Missing userMessage" });
  }

  const imageUrl = findImageKeyword(userMessage);

  try {
    if (imageUrl && !userMessage.toLowerCase().includes("vurder")) {
      const aiReply = `📷 <b>Billede bestilt:</b><br><img src="${imageUrl}" alt="billede" style="max-width:100%; margin-top:8px;">`;
      return res.json({
        aiReply,
        findings: getDummyFindings(),
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: basePrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
    });

    const aiReply = response.choices[0].message.content;

    const findingsPrompt = `Patienthistorie:\n"""${aiReply}"""\n\nGiv en liste over relevante objektive fund (for alle organ-systemer, som du finder nødvendige ud fra teksten). Formatér svaret som JSON: [{"area":"Chest","description":"..."}]\nSvar kun med JSON, ikke tekst.`;

    const findingsResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: findingsPrompt }],
      temperature: 0.2,
    });

    let findings = [];
    try {
      findings = JSON.parse(findingsResponse.choices[0].message.content);
    } catch {
      findings = getDummyFindings();
    }

    return res.json({ aiReply, findings });

  } catch (err) {
    console.error("❌ AI error:", err.message);
    res.status(500).json({ error: "AI error: " + err.message });
  }
});

export default router;
