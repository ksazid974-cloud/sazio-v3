export const runtime = "edge";

export default async function handler(req) {
  try {
    const { idea, type } = await req.json();

    const prompt = `
Create ${type} content for:
${idea}

Include:
- Title
- Hook
- Script
- SEO
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
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
      JSON.stringify(data);

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ result: "Server error" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
