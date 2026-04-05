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
    const safeType = typeof type === "string" && type.trim() ? type.trim() : "content";
    const safeOutput =
      typeof output === "string" && output.trim()
        ? output.trim()
        : "title, hook, script, SEO";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea required" });
    }

    const prompt = `
Reply ONLY in the SAME language as the user's idea.

You are Sazio AI.
Be practical, short, clean, and honest.
No greeting.
No intro.
No fake claims.
No empty bullets.
Do not skip any section.
Keep every line complete.

User Idea: ${safeIdea}
Content Type: ${safeType}
User Wants: ${safeOutput}

Return in EXACT format below:

Title:
- [short strong title]
- [short strong title]
- [short strong title]

Hook:
- [1 complete strong hook line]

Script:
- [line 1]
- [line 2]
- [line 3]

SEO:
Keywords: [3 short keywords]
Hashtags: [3 short hashtags]
Caption: [1 short caption]

Analysis:
Score: [realistic percentage]
Strength: [1 short point]
Weakness: [1 short point]
Improve: [1 short point]

IMPORTANT:
- Keep total response compact
- Finish every sentence
- Do not write anything outside this format
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
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 650
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        result: "AI ERROR: " + JSON.stringify(data)
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || !text.trim()) {
      return res.status(500).json({
        result: "No AI response"
      });
    }

    const cleanText = text
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();

    return res.status(200).json({
      result: cleanText
    });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
