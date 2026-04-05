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

You are Sazio AI.
Be practical, short, complete, and honest.
No greeting.
No intro.
No fake claims.
No incomplete lines.

User idea: ${safeIdea}
Content type: ${safeType}
User wants: ${safeOutput}

Generate complete content for this idea.
`;

    const schema = {
      type: "object",
      properties: {
        titles: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: { type: "string" }
        },
        hook: { type: "string" },
        script: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: { type: "string" }
        },
        seo: {
          type: "object",
          properties: {
            keywords: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string" }
            },
            hashtags: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string" }
            },
            caption: { type: "string" }
          },
          required: ["keywords", "hashtags", "caption"]
        },
        analysis: {
          type: "object",
          properties: {
            score: { type: "string" },
            strength: { type: "string" },
            weakness: { type: "string" },
            improve: { type: "string" }
          },
          required: ["score", "strength", "weakness", "improve"]
        }
      },
      required: ["titles", "hook", "script", "seo", "analysis"]
    };

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
            responseMimeType: "application/json",
            responseJsonSchema: schema,
            temperature: 0.5,
            maxOutputTokens: 700
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

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw || !raw.trim()) {
      return res.status(500).json({
        result: "No AI response"
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({
        result: "JSON PARSE ERROR: " + raw
      });
    }

    const titles = Array.isArray(parsed.titles) ? parsed.titles : [];
    const script = Array.isArray(parsed.script) ? parsed.script : [];
    const keywords = Array.isArray(parsed?.seo?.keywords) ? parsed.seo.keywords : [];
    const hashtags = Array.isArray(parsed?.seo?.hashtags) ? parsed.seo.hashtags : [];

    const finalText = `Title:
- ${titles[0] || "Title 1"}
- ${titles[1] || "Title 2"}
- ${titles[2] || "Title 3"}

Hook:
- ${parsed.hook || "Strong hook"}

Script:
- ${script[0] || "Script line 1"}
- ${script[1] || "Script line 2"}
- ${script[2] || "Script line 3"}

SEO:
Keywords: ${(keywords[0] || "keyword1")}, ${(keywords[1] || "keyword2")}, ${(keywords[2] || "keyword3")}
Hashtags: ${(hashtags[0] || "#tag1")} ${(hashtags[1] || "#tag2")} ${(hashtags[2] || "#tag3")}
Caption: ${parsed?.seo?.caption || "Short caption"}

Analysis:
Score: ${parsed?.analysis?.score || "70%"}
Strength: ${parsed?.analysis?.strength || "Strong emotional angle"}
Weakness: ${parsed?.analysis?.weakness || "Hook can be stronger"}
Improve: ${parsed?.analysis?.improve || "Add more curiosity at the start"}`;

    return res.status(200).json({
      result: finalText
    });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
