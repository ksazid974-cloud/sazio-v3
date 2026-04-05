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
You are Sazio AI, a professional creator assistant.

STRICT RULES:
- Reply ONLY in the SAME language as user input
- NO greetings (no "नमस्ते", no intro lines)
- NO empty bullets
- NO incomplete points
- Keep output clean and professional
- Do NOT make fake claims like "100% viral"
- Make hook VERY strong (curiosity / shock / emotion)
- Keep script short but engaging
- Make titles clickable
- Remove unnecessary text

USER IDEA:
"${safeIdea}"

CONTENT TYPE:
"${safeType}"

USER WANTS:
"${safeOutput}"

RETURN EXACT FORMAT:

Title:
- [Title 1]
- [Title 2]
- [Title 3]

Hook:
[One powerful viral hook]

Script:
[Short engaging script]

SEO:
Keywords: [keywords]
Hashtags: [#tags]
Caption: [1 line caption]

Analysis:
Viral Score: [realistic % only]

Strengths:
- [point]
- [point]

Weak Points:
- [point]
- [point]

Missing:
- [point]
- [point]

Improvement:
- [point]
- [point]

Platform Fit:
- [platform + reason]

IMPORTANT:
- Every section must be filled
- No blank lines
- No extra symbols
- No broken formatting
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
            temperature: 0.9,
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

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || !text.trim()) {
      return res.status(500).json({
        result: "No AI response"
      });
    }

    // 🔥 FINAL CLEANING (EXTRA SAFETY)
    text = text
      .replace(/\\n{2,}/g, "\n")
      .replace(/\\*\\s*$/gm, "")
      .trim();

    return res.status(200).json({
      result: text
    });

  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
