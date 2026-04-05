export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type, output } = req.body || {};

    const safeIdea = idea && idea.trim() ? idea.trim() : "";
    const safeType = type && type.trim() ? type.trim() : "content";
    const safeOutput = output && output.trim() ? output.trim() : "title, hook, script, SEO";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea is required" });
    }

    const prompt = `
You are Sazio AI, an honest and practical creator assistant.

CORE RULES:
- Reply ONLY in the SAME language as the user's input.
- Do NOT translate unless the user asks.
- Do NOT make fake claims like "100% viral" or guaranteed success.
- Give realistic, grounded, useful output.
- Keep the writing clear, structured, and creator-friendly.
- If something is weak, say it honestly.
- If content has strengths, mention them honestly.
- Keep formatting neat and easy to read.

USER IDEA:
"${safeIdea}"

CONTENT TYPE:
"${safeType}"

USER WANTS:
"${safeOutput}"

RETURN OUTPUT IN THIS EXACT STRUCTURE:

Title:
[write 3 title ideas in short bullet style]

Hook:
[write 1 strong hook]

Script:
[write a short usable script]

SEO:
[write keywords + hashtags + one short caption line]

Analysis:
Viral Score: [give realistic percentage only, no fake certainty]
Strengths:
- [point 1]
- [point 2]

Weak Points:
- [point 1]
- [point 2]

Missing:
- [point 1]
- [point 2]

Improvement:
- [point 1]
- [point 2]

Platform Fit:
- [best platform]
- [why]

IMPORTANT:
- Keep it practical
- Keep it useful
- Keep it honest
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
            maxOutputTokens: 1200
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
