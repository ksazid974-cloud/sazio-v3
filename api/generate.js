export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type, output } = req.body || {};

    const prompt = `
You are a WORLD-CLASS viral content creator like top YouTubers.

Create HIGHLY VIRAL ${type || "video"} content for:
"${idea || "content idea"}"

User wants:
${output || "full viral content"}

Rules:
- Hook must grab attention in first 3 seconds
- Titles must be clickbait + curiosity based
- Script should be emotional + engaging
- Add psychological triggers (money, fear, curiosity, surprise)
- Make content feel like 10M+ views potential

Output format:

🔥 Title Ideas (5)
💡 Content Angle
🎯 Hook (very strong)
🎬 Script (short viral format)
📈 SEO Tags (high search keywords)

Make it addictive and share-worthy.
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
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        result: "ERROR: " + JSON.stringify(data)
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        result: "NO TEXT: " + JSON.stringify(data)
      });
    }

    return res.status(200).json({ result: text });

  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
