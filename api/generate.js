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
        : "title, hook, script, SEO, analysis";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea required" });
    }

    const prompt = `
Reply ONLY in the SAME language as the user's idea.

Be practical, short, complete, and honest.
No greeting.
No intro.
No fake claims.
No empty bullets.
No incomplete line.

Idea: ${safeIdea}
Content type: ${safeType}
User wants: ${safeOutput}

Return EXACTLY in this format:

TITLE1: short title
TITLE2: short title
TITLE3: short title
HOOK: one complete strong hook
SCRIPT1: short line
SCRIPT2: short line
SCRIPT3: short line
KEYWORDS: keyword1, keyword2, keyword3
HASHTAGS: #tag1 #tag2 #tag3
CAPTION: short caption
SCORE: realistic percentage
STRENGTH: one short strength
WEAKNESS: one short weakness
IMPROVE: one short improvement

Rules:
- Keep every value short
- Finish every line
- Do not write anything outside these lines
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
            temperature: 0.4,
            maxOutputTokens: 420
          }
        })
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      return res.status(429).json({
        result: "Daily free limit reached. Please wait and try again later."
      });
    }

    if (!response.ok) {
      return res.status(500).json({
        result: "AI ERROR: " + JSON.stringify(data)
      });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw || !raw.trim()) {
      return res.status(500).json({
        result: "No AI response"
      });
    }

    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    function getValue(prefix, fallback) {
      const line = lines.find((l) => l.startsWith(prefix));
      if (!line) return fallback;
      const value = line.slice(prefix.length).trim();
      return value || fallback;
    }

    const title1 = getValue("TITLE1:", "Strong title 1");
    const title2 = getValue("TITLE2:", "Strong title 2");
    const title3 = getValue("TITLE3:", "Strong title 3");
    const hook = getValue("HOOK:", "A strong hook");
    const script1 = getValue("SCRIPT1:", "Script line 1");
    const script2 = getValue("SCRIPT2:", "Script line 2");
    const script3 = getValue("SCRIPT3:", "Script line 3");
    const keywords = getValue("KEYWORDS:", "keyword1, keyword2, keyword3");
    const hashtags = getValue("HASHTAGS:", "#tag1 #tag2 #tag3");
    const caption = getValue("CAPTION:", "Short caption");
    const score = getValue("SCORE:", "70%");
    const strength = getValue("STRENGTH:", "Strong emotional angle");
    const weakness = getValue("WEAKNESS:", "Hook can be stronger");
    const improve = getValue("IMPROVE:", "Add more curiosity at the start");

    const finalText = `Title:
- ${title1}
- ${title2}
- ${title3}

Hook:
- ${hook}

Script:
- ${script1}
- ${script2}
- ${script3}

SEO:
Keywords: ${keywords}
Hashtags: ${hashtags}
Caption: ${caption}

Analysis:
Score: ${score}
Strength: ${strength}
Weakness: ${weakness}
Improve: ${improve}`;

    return res.status(200).json({
      result: finalText
    });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
