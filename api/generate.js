export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ result: "Only POST allowed" });
  }

  try {

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea } = req.body || {};

    if (!idea || !idea.trim()) {
      return res.status(400).json({ result: "Idea required" });
    }

    const prompt = `
You are Sazio AI.

STRICT RULES:
- No intro
- No "Here is"
- No explanation
- No markdown
- No repeating input as title
- Clean Hindi / Hinglish
- Structured output only

Return EXACT format:

Title:
- (3 different titles, input repeat nahi)

Hook:
- (strong hook)

Script:
- (3 short lines)

SEO:
Keywords: (3 keywords)
Hashtags: (#3 tags)
Caption: (short)

Analysis:
Viral Score: (%)
Strength:
Weakness:
Improve:

Idea: ${idea}
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
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600
          }
        })
      }
    );

    const data = await response.json();

    let text = "";

    try {
      text = data.candidates[0].content.parts[0].text;
    } catch {
      text = "";
    }

    // 🔥 CLEAN OUTPUT (IMPORTANT)
    text = text
      .replace(/Here.*$/gim, "")
      .replace(/Idea.*$/gim, "")
      .replace(/Return.*$/gim, "")
      .replace(/```/g, "")
      .replace(/\*\*/g, "")
      .trim();

    // 🔥 FALLBACK (अगर AI fail हो जाए)
    if (!text) {
      text = `Title:
- Emotional Story
- Real Life Struggle
- Hidden Truth

Hook:
- Ek aisi kahani jo dil ko chhoo sakti hai.

Script:
- Shuruaat me strong moment hota hai.
- Beech me struggle aur emotion hota hai.
- End me impact hota hai.

SEO:
Keywords: viral story, emotional video, short content
Hashtags: #viral #story #short
Caption: Strong emotional content

Analysis:
Viral Score: 75%
Strength: Emotional hai
Weakness: Hook aur strong ho sakta hai
Improve: Shock add karo`;
    }

    return res.status(200).json({ result: text });

  } catch (error) {
    return res.status(500).json({ result: "Server error" });
  }
}
