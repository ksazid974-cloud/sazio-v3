export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ result: "Method not allowed" });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type, output } = req.body || {};
    const safeIdea = typeof idea === "string" ? idea.trim() : "";
    const safeType = typeof type === "string" && type.trim() ? type.trim() : "content";
    const safeOutput =
      typeof output === "string" && output.trim()
        ? output.trim()
        : "title, hook, script, SEO, analysis";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea required" });
    }

    function detectLanguage(text) {
      if (/[\u0900-\u097F]/.test(text)) return "hi";
      if (/[\u0600-\u06FF]/.test(text)) return "ar";
      return "en";
    }

    function detectTone(text) {
      const lower = text.toLowerCase();
      if (
        lower.includes("sad") ||
        lower.includes("emotional") ||
        lower.includes("गरीब") ||
        lower.includes("दर्द") ||
        lower.includes("संघर्ष") ||
        lower.includes("रो") ||
        lower.includes("heart")
      ) {
        return "emotional";
      }
      if (
        lower.includes("funny") ||
        lower.includes("comedy") ||
        lower.includes("मजेदार") ||
        lower.includes("हास्य")
      ) {
        return "funny";
      }
      if (
        lower.includes("motivation") ||
        lower.includes("success") ||
        lower.includes("सफलता") ||
        lower.includes("मेहनत")
      ) {
        return "motivational";
      }
      return "general";
    }

    function buildFallback(text) {
      const lang = detectLanguage(text);
      const tone = detectTone(text);

      if (lang === "hi") {
        let hook = "क्या आपने कभी सोचा है कि इस कहानी के पीछे कितनी तकलीफ और उम्मीद छिपी हो सकती है?";
        let strength = "Idea emotional aur relatable hai.";
        let weakness = "Hook aur zyada specific ho sakta hai.";
        let improve = "Shuruaat me shock, danger, ya curiosity aur badhao.";
        let score = "72%";

        if (tone === "funny") {
          hook = "एक छोटी सी बात कैसे मजेदार chaos में बदल सकती है, यही इस idea की ताकत है।";
          strength = "Idea entertaining aur easy-to-watch hai.";
          weakness = "Comedy point aur sharper ho sakta hai.";
          improve = "Ek unexpected twist ya punchline aur jodo.";
          score = "70%";
        } else if (tone === "motivational") {
          hook = "जब हालात हार मानने को कहें, तभी असली कहानी शुरू होती है।";
          strength = "Idea inspiring aur audience-friendly hai.";
          weakness = "Outcome aur clear ho sakta hai.";
          improve = "Ek strong before-after moment jodo.";
          score = "74%";
        }

        return `Title:
- ${text} की अनकही कहानी
- ${text} का संघर्ष
- ${text} से जुड़ी एक भावुक दास्तान

Hook:
- ${hook}

Script:
- यह कहानी एक ऐसे मोड़ से शुरू होती है जो तुरंत ध्यान खींच सकती है।
- बीच में संघर्ष, भावना और उम्मीद का तत्व इस idea को मजबूत बनाता है।
- सही प्रस्तुति और बेहतर hook के साथ यह content अच्छा perform कर सकता है।

SEO:
Keywords: ${text}, viral story, emotional content
Hashtags: #story #viral #content
Caption: एक ऐसी कहानी जो लोगों का ध्यान रोक सकती है।

Analysis:
Score: ${score}
Strength: ${strength}
Weakness: ${weakness}
Improve: ${improve}`;
      }

      if (lang === "ar") {
        return `Title:
- القصة غير المروية عن ${text}
- صراع ${text}
- حكاية مؤثرة عن ${text}

Hook:
- هل فكرت يومًا كم الألم أو الأمل المخفي وراء ${text}؟

Script:
- تبدأ هذه الفكرة بلحظة قادرة على جذب الانتباه بسرعة.
- وجود الصراع والمشاعر يجعل الفكرة أقوى وأكثر قربًا من الناس.
- مع افتتاحية أفضل يمكن أن يزداد تأثير هذا المحتوى بشكل واضح.

SEO:
Keywords: ${text}, قصة مؤثرة, محتوى قصير
Hashtags: #قصة #ترند #مؤثر
Caption: فكرة بسيطة لكنها تحمل تأثيرًا قويًا.

Analysis:
Score: 72%
Strength: الفكرة عاطفية وقريبة من الجمهور.
Weakness: المقدمة تحتاج خصوصية أكبر.
Improve: ابدأ بجملة أقوى فيها فضول أو صدمة.`;
      }

      return `Title:
- The untold story of ${text}
- The struggle behind ${text}
- A powerful story about ${text}

Hook:
- Have you ever thought about how much hidden struggle or emotion can exist behind ${text}?

Script:
- This idea starts with a moment that can quickly grab attention.
- The struggle and emotion in the middle make the content more watchable.
- With a stronger opening, this content can perform much better.

SEO:
Keywords: ${text}, viral story, emotional content
Hashtags: #story #viral #content
Caption: A simple idea that can connect with viewers.

Analysis:
Score: 72%
Strength: The idea is relatable and emotionally engaging.
Weakness: The hook can be more specific.
Improve: Start with stronger curiosity, danger, or surprise.`;
    }

    const prompt = `
Reply ONLY in the SAME language as the user's idea.

You are Sazio AI, an honest creator assistant.

STRICT RULES:
- No greeting
- No intro
- No fake promises like "100% viral"
- No placeholder text
- No incomplete lines
- Keep output compact, strong, and useful
- Be realistic, not scammy
- Hook must be stronger than normal generic content
- Titles should be clickable and emotionally or curiosity driven
- Analysis should be honest and practical

User idea: ${safeIdea}
Content type: ${safeType}
User wants: ${safeOutput}

Return EXACTLY in this format:

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
            temperature: 0.55,
            maxOutputTokens: 650
          }
        })
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      return res.status(200).json({
        result: buildFallback(safeIdea)
      });
    }

    if (!response.ok) {
      return res.status(500).json({
        result: "AI ERROR: " + JSON.stringify(data)
      });
    }

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || !text.trim()) {
      return res.status(200).json({
        result: buildFallback(safeIdea)
      });
    }

    text = text
      .replace(/Strong title \d/gi, "")
      .replace(/Script line \d/gi, "")
      .replace(/keyword\d/gi, "")
      .replace(/#tag\d/gi, "")
      .replace(/Short caption/gi, "")
      .replace(/A strong hook/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      return res.status(200).json({
        result: buildFallback(safeIdea)
      });
    }

    return res.status(200).json({
      result: text
    });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
