export default async function handler(req, res) {
  try {
    const { idea, type, output } = req.body;

    const prompt = `
Create high-quality content.

Idea: ${idea}
Type: ${type}
Output: ${output}

Give:
1. Title Ideas (3)
2. Hook
3. Content Angle
4. Short Script
5. SEO caption + keywords
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    const result =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No result";

    res.status(200).json({ result });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
