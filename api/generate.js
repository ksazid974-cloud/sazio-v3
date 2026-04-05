export const runtime = "edge";

export default async function handler(req) {
  try {
    const { idea, type } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({
        result: "❌ API KEY NOT FOUND"
      }));
    }

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

    // 🔥 DEBUG OUTPUT
    if (!data.candidates) {
      return new Response(JSON.stringify({
        result: "❌ ERROR: " + JSON.stringify(data)
      }));
    }

    const result = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ result }));

  } catch (e) {
    return new Response(JSON.stringify({
      result: "❌ SERVER ERROR"
    }));
  }
}
