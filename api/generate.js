export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type, output } = req.body || {};
    const safeIdea = typeof idea === "string" ? idea.trim() : "";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea required" });
    }

    // 🔥 DETECT SYSTEM
    function detectLanguage(text) {
      if (/[\u0900-\u097F]/.test(text)) return "hi";
      return "en";
    }

    function detectTone(text) {
      const t = text.toLowerCase();
      if (t.includes("funny") || t.includes("comedy")) return "funny";
      if (t.includes("motivation") || t.includes("success")) return "motivational";
      if (t.includes("sad") || t.includes("emotional") || t.includes("गरीब")) return "emotional";
      return "general";
    }

    function detectContentType(text) {
      const t = text.toLowerCase();
      if (t.includes("ad") || t.includes("sell")) return "ad";
      if (t.includes("story") || t.includes("kahani")) return "story";
      if (t.includes("reel") || t.includes("short")) return "short";
      return "general";
    }

    const lang = detectLanguage(safeIdea);
    const tone = detectTone(safeIdea);
    const contentType = detectContentType(safeIdea);

    // 🔥 SMART ANALYZER (ADVANCED)
    function buildSmartAnalysis() {
      let score = 70;
      let hookScore = 65;
      let retention = 60;

      if (tone === "emotional") {
        score += 5;
        retention += 10;
      }

      if (contentType === "short") {
        retention += 10;
      }

      if (safeIdea.length > 20) {
        score += 3;
      }

      return {
        score: score + "%",
        hook: hookScore + "%",
        retention: retention + "%"
      };
    }

    const analysis = buildSmartAnalysis();

    // 🔥 PROMPT
    const prompt = `
Reply ONLY in ${lang === "hi" ? "Hindi" : "English"}.

Be smart, realistic, and short.

Idea: ${safeIdea}
Tone: ${tone}
Type: ${contentType}

Return:

Title:
- ...
- ...
- ...

Hook:
- ...

Script:
- ...
- ...
- ...

SEO:
Keywords: ...
Hashtags: ...
Caption: ...

Analysis:
Viral Score: ${analysis.score}
Hook Strength: ${analysis.hook}
Retention Chance: ${analysis.retention}
Strength: ...
Weakness: ...
Improve: ...
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
            temperature: 0.6,
            maxOutputTokens: 650
          }
        })
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      return res.status(200).json({
        result: `⚠️ Daily limit reached.\n\nQuick idea:\n${safeIdea} can perform better with stronger hook and emotional angle.`
      });
    }

    if (!response.ok) {
      return res.status(500).json({
        result: "AI ERROR"
      });
    }

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      text = `Title:
- ${safeIdea}
- ${safeIdea} story
- Viral ${safeIdea}

Hook:
- A strong idea that can grab attention

Script:
- Start with attention
- Add emotion
- End with twist

SEO:
Keywords: ${safeIdea}
Hashtags: #viral
Caption: Simple idea

Analysis:
Viral Score: ${analysis.score}
Hook Strength: ${analysis.hook}
Retention Chance: ${analysis.retention}
Strength: Relatable
Weakness: Weak hook
Improve: Add curiosity`;
    }

    return res.status(200).json({
      result: text.trim()
    });

  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR"
    });
  }
}
