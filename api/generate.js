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
You are Sazio AI — strict professional content generator.

STRICT RULES (VERY IMPORTANT):
- Reply ONLY in SAME language as user
- NO greeting, NO intro text
- ALWAYS follow structure EXACTLY
- NEVER skip any section
- ALWAYS generate EXACTLY 3 titles
- NEVER leave any bullet empty
- Hook MUST be strong (shock, curiosity, emotion)
- Keep output short and clean
- NO fake claims (no "100% viral")

USER IDEA:
"${safeIdea}"

CONTENT TYPE:
"${safeType}"

USER WANTS:
"${safeOutput}"

RETURN EXACT FORMAT (NO CHANGE):

Title:
- Title 1
- Title 2
- Title 3

Hook:
[Strong hook]

Script:
[Short engaging script]

SEO:
Keywords: keyword1, keyword2, keyword3
Hashtags: #tag1 #tag2 #tag3
Caption: one line caption

Analysis:
Viral Score: realistic %

Strengths:
- point
- point

Weak Points:
- point
- point

Missing:
- point
- point

Improvement:
- point
- point

Platform Fit:
- platform + reason

IMPORTANT:
- Do NOT change format
- Do NOT skip anything
- Fill every section
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
            temperature: 0.7,
            maxOutputTokens: 1000
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

    // 🔥 FINAL SAFETY CLEAN
    text = text
      .replace(/\\n{2,}/g, "\n")
      .replace(/\\*\\s*$/gm, "")
      .replace(/Title:\\n-\\s*$/gm, "")
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
