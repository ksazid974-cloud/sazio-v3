export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { idea, type, output } = req.body;

    const prompt = `
Create high quality ${type} content for:
"${idea}"

Include:
- Title ideas
- Hook
- Script
- SEO
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    const result =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No AI response";

    res.status(200).json({ result });

  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
