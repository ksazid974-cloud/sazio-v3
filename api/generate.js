export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea } = req.body || {};
    const safeIdea = typeof idea === "string" ? idea.trim() : "";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea required" });
    }

    const prompt = `
Reply ONLY in the SAME language as the user's idea.

Be practical, short, complete and real.
No greeting.
No intro.
No fake placeholders.
No "title 1", "script line" type text.

Idea: ${safeIdea}

Return in this format:

Title:
- ...
- ...
- ...

Hook:
- ...

Script:
- ...
- ...
- ...

SEO:
Keywords: ...
Hashtags: ...
Caption: ...

Analysis:
Score: ...
Strength: ...
Weakness: ...
Improve: ...
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
            temperature: 0.5,
            maxOutputTokens: 600
          }
        })
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      return res.status(429).json({
        result: "Daily limit reached. Try again later."
      });
    }

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

    // 🔥 CLEAN OUTPUT (important)
    text = text
      .replace(/Strong title \d/gi, "")
      .replace(/Script line \d/gi, "")
      .replace(/keyword\d/gi, "")
      .replace(/#tag\d/gi, "")
      .replace(/Short caption/gi, "")
      .replace(/A strong hook/gi, "")
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
