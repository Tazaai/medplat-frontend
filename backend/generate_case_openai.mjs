import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generateCase = async (topicInput, niveau = "simpel", lang = "da") => {
  const systemPrompt = `
Du er et panel af speciallæger.
Du skal generere en realistisk patientcase ud fra det præcise emne, niveau og område.
- Hvis niveau er 'kompleks': tilføj progression, komplikationer, overlap med andre sygdomme.
- For Emergency Medicine: lav akutte forløb med dynamiske ændringer.
- For andre specialer: lav dybdegående, stabile cases.
DU MÅ KUN returnere STRICT VALID JSON som specificeret — INGEN forklaring udenfor JSON.

JSON FORMAT:
{
  "aiReply": {
    "history": "...",
    "objective": "...",
    "paraclinic": ["..."],
    "diff_diag": ["..."],
    "diagnose": "...",
    "treatment": "...",
    "conclusion": "..."
  },
  "findings": [
    {"area":"...","description":"..."}
  ]
}

Svar på ${lang.toUpperCase()}.
`;

  const userPrompt = `
Generér en patientcase for emnet: "${topicInput}".
Niveau: ${niveau}.
Inkluder: anamnesis, objektiv undersøgelse, paraklinik, differentialdiagnoser, diagnose, behandling og konklusion.
Hvis kompleks: tilføj realistiske komplikationer eller uforudsete udviklinger.
Kun JSON!
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3
  });

  try {
    const raw = response.choices[0].message.content;
    const clean = raw.replace(/```json|```/gi, "").trim();
    return JSON.stringify(JSON.parse(clean));
  } catch (err) {
    console.error("❌ JSON parse failed:", err);
    return JSON.stringify({
      aiReply: {
        history: "Fejl i JSON.",
        objective: "-",
        paraclinic: [],
        diff_diag: [],
        diagnose: "-",
        treatment: "-",
        conclusion: "-"
      },
      findings: []
    });
  }
};

export default generateCase;
