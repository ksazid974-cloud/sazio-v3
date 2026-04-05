export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type } = req.body || {};

    if (!idea) {
      return res.status(400).json({ result: "Idea required" });
    }

    const prompt = `
Reply in same language.

STRICT:
- No intro
- No extra text
- Short output
- All sections must be included

FORMAT:

Title:
- 3 strong titles

Hook:
- 1 strong line

Script:
- 3 to 4 lines

SEO:
- 3 keywords
- 3 hashtags
- 1 caption

Analysis:
- Score %
- 1 strength
- 1 weakness
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
              parts: [{ text: idea + "\n\n" + prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500 // 🔥 cut fix
          }
        })
      }
    );

    const data = await response.json();

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ result: "No response" });
    }

    return res.status(200).json({ result: text });

  } catch (e) {
    return res.status(500).json({ result: "Error: " + e.message });
  }
}
