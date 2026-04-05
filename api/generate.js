export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type } = req.body || {};

    const prompt = `
Create ${type || "video"} content for:
${idea || "content idea"}

Include:
- Title
- Hook
- Script
- SEO
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(500).json({
        result: "ERROR: " + JSON.stringify(data)
      });
    }

    const result = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
