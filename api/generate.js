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

    async function callGemini(prompt) {
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
              temperature: 0.5,
              maxOutputTokens: 180
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("AI ERROR: " + JSON.stringify(data));
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text || !text.trim()) {
        throw new Error("No AI response");
      }

      return text.trim();
    }

    const baseRules = `
Reply ONLY in the SAME language as this user idea:
"${safeIdea}"

Content type: ${safeType}
User wants: ${safeOutput}

Rules:
- No greeting
- No intro
- No fake claims
- Keep output short, complete, practical
- Finish every line
`;

    const titlesPrompt = `
${baseRules}

Give EXACTLY 3 short strong titles.
Return ONLY:
- title 1
- title 2
- title 3
`;

    const hookPrompt = `
${baseRules}

Give EXACTLY 1 strong hook line.
Return ONLY:
- one hook line
`;

    const scriptPrompt = `
${baseRules}

Give EXACTLY 3 short script lines.
Return ONLY:
- line 1
- line 2
- line 3
`;

    const seoPrompt = `
${baseRules}

Return SEO in EXACT format:
Keywords: keyword1, keyword2, keyword3
Hashtags: #tag1 #tag2 #tag3
Caption: one short caption
`;

    const analysisPrompt = `
${baseRules}

Return analysis in EXACT format:
Score: realistic percentage
Strength: one short point
Weakness: one short point
Improve: one short point
`;

    const [titlesRaw, hookRaw, scriptRaw, seoRaw, analysisRaw] = await Promise.all([
      callGemini(titlesPrompt),
      callGemini(hookPrompt),
      callGemini(scriptPrompt),
      callGemini(seoPrompt),
      callGemini(analysisPrompt)
    ]);

    function cleanBullets(text) {
      return text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          if (line.startsWith("-")) return line;
          return "- " + line;
        })
        .join("\n");
    }

    function findLine(text, prefix, fallback) {
      const line = text
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()));
      if (!line) return fallback;
      const value = line.slice(prefix.length).trim();
      return value || fallback;
    }

    const finalText = `Title:
${cleanBullets(titlesRaw)}

Hook:
${cleanBullets(hookRaw)}

Script:
${cleanBullets(scriptRaw)}

SEO:
Keywords: ${findLine(seoRaw, "Keywords:", "keyword1, keyword2, keyword3")}
Hashtags: ${findLine(seoRaw, "Hashtags:", "#tag1 #tag2 #tag3")}
Caption: ${findLine(seoRaw, "Caption:", "Short caption")}

Analysis:
Score: ${findLine(analysisRaw, "Score:", "70%")}
Strength: ${findLine(analysisRaw, "Strength:", "Strong emotional angle")}
Weakness: ${findLine(analysisRaw, "Weakness:", "Hook can be stronger")}
Improve: ${findLine(analysisRaw, "Improve:", "Add more curiosity at the start")}`;

    return res.status(200).json({
      result: finalText
    });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
