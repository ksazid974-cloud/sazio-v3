export default async function handler(req, res) {
  // Method check
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    // API key check
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type, output } = req.body || {};

    // Input safety
    if (!idea || idea.trim() === "") {
      return res.status(400).json({ result: "Idea is required" });
    }

    // 🎯 FINAL MASTER PROMPT
    const prompt = `
You are Sazio AI — a professional viral content creator system.

Create HIGH QUALITY ${type || "video"} content for:
"${idea}"

User wants:
${output || "title, hook, script, SEO"}

IMPORTANT RULES:
- Always return clean structured output
- Keep content simple, powerful, and engaging
- Make hook attention-grabbing (first 3 seconds)
- Script should be short, emotional, and easy to understand
- SEO should include keywords and hashtags
- No unnecessary long paragraphs

OUTPUT FORMAT (STRICT):

Title:
Hook:
Script:
SEO:
`;

    // API call
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
          ]
        })
      }
    );

    const data = await response.json();

    // Error handling
    if (!response.ok) {
      return res.status(500).json({
        result: "AI ERROR: " + JSON.stringify(data)
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        result: "No AI response"
      });
    }

    // Clean output
    const cleanText = text.trim();

    return res.status(200).json({
      result: cleanText
    });

  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
