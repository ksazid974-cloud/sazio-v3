export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type } = req.body || {};
    const safeIdea = typeof idea === "string" ? idea.trim() : "";
    const safeType = typeof type === "string" && type.trim() ? type.trim() : "content";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea required" });
    }

    // ---------- LANGUAGE DETECT ----------
    function detectLanguage(text) {
      if (/[\u0900-\u097F]/.test(text)) return "hi";

      const t = text.toLowerCase();
      const hindiWords = ["ek","ki","ka","kisan","kahani","bnao","garib","maa","gaon","dard","mehnat"];

      let count = 0;
      hindiWords.forEach(w => {
        if (t.includes(w)) count++;
      });

      return count >= 2 ? "hi" : "en";
    }

    const lang = detectLanguage(safeIdea);

    const languageInstruction =
      lang === "hi"
        ? "Reply in natural Hinglish (not pure Hindi, not English)"
        : "Reply in English";

    // ---------- 🔥 FINAL VIRAL PROMPT ----------
    const prompt = `
${languageInstruction}

You are Sazio AI — viral short content expert.

STRICT:
- No generic lines
- No filler words
- Make it cinematic and real
- Hook must stop scrolling
- Script must feel like real scenes

Idea: ${safeIdea}
Type: ${safeType}

FORMAT:

TITLE1:
TITLE2:
TITLE3:

HOOK:

SCRIPT1:
SCRIPT2:
SCRIPT3:

KEYWORDS:
HASHTAGS:
CAPTION:

SCORE:
STRENGTH:
WEAKNESS:
MISSING:
IMPROVE:
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400
          }
        })
      }
    );

    const data = await response.json();

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      return res.status(200).json({
        result: "⚠️ AI failed. Try again."
      });
    }

    return res.status(200).json({
      result: raw.trim()
    });

  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
