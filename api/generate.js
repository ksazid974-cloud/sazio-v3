export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type, output } = req.body || {};

    if (!idea || !idea.trim()) {
      return res.status(400).json({ result: "Idea is required" });
    }

    const safeType = type && type.trim() ? type.trim() : "content";
    const safeOutput = output && output.trim() ? output.trim() : "title, hook, script, SEO";

    const prompt = `
You are Sazio AI, an honest creator assistant.

IMPORTANT RULES:
- Reply in the SAME language as the user's input.
- Do not claim guaranteed virality.
- Be practical, grounded, and non-scammy.
- Keep output clean, useful, and creator-friendly.
- Do not use unnecessary long paragraphs.

User idea:
"${idea}"

Content type:
"${safeType}"

User wants:
"${safeOutput}"

Return output in EXACT structure below:

Title:
Hook:
Script:
SEO:

Analysis:
Viral Score:
Strengths:
Weak Points:
Missing:
Improvement:
Platform Fit:
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
            temperature: 0.8,
            maxOutputTokens: 900
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

    return res.status(200).json({
      result: text.trim()
    });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
  }
