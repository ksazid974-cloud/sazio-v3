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

    function detectLanguage(text) {
      if (/[\u0900-\u097F]/.test(text)) return "hi";
      if (/[\u0600-\u06FF]/.test(text)) return "ar";
      return "en";
    }

    function buildFallback(text) {
      const lang = detectLanguage(text);

      if (lang === "hi") {
        return `Title:
- ${text} की भावुक कहानी
- ${text} का संघर्ष
- ${text} की अनकही दास्तान

Hook:
- क्या आपने कभी सोचा है कि ${text} के पीछे कितनी तकलीफ छिपी हो सकती है?

Script:
- यह कहानी एक गहरे संघर्ष से शुरू होती है।
- हालात मुश्किल हैं, लेकिन उम्मीद अभी बाकी है।
- सही प्रस्तुति के साथ यह idea लोगों का ध्यान खींच सकता है।

SEO:
Keywords: ${text}, emotional story, viral video
Hashtags: #story #viral #emotional
Caption: एक ऐसी कहानी जो दिल को छू सकती है।

Analysis:
Score: 68%
Strength: Idea emotional aur relatable hai.
Weakness: Hook aur specific ban सकता है.
Improve: शुरुआत में shock ya curiosity aur बढ़ाओ.`;
      }

      if (lang === "ar") {
        return `Title:
- قصة مؤثرة عن ${text}
- صراع ${text}
- الحكاية غير المروية لـ ${text}

Hook:
- هل فكرت يومًا كم الألم المخفي وراء ${text}؟

Script:
- تبدأ هذه الفكرة بصراع واضح ومؤثر.
- الظروف صعبة لكن ما زال هناك أمل.
- مع تقديم أقوى يمكن أن تجذب هذه الفكرة الانتباه.

SEO:
Keywords: ${text}, قصة مؤثرة, فيديو قصير
Hashtags: #قصة #ترند #مؤثر
Caption: فكرة بسيطة لكن يمكن أن تلامس القلوب.

Analysis:
Score: 68%
Strength: الفكرة عاطفية وقريبة من الناس.
Weakness: الخطاف يحتاج أن يكون أقوى.
Improve: ابدأ بجملة صادمة أو فضولية أكثر.`;
      }

      return `Title:
- Emotional story about ${text}
- The struggle behind ${text}
- The untold story of ${text}

Hook:
- Have you ever thought about how much hidden struggle can exist behind ${text}?

Script:
- This idea starts with a clear emotional struggle.
- The situation is difficult, but hope still remains.
- With stronger presentation, this idea can attract viewers.

SEO:
Keywords: ${text}, emotional story, viral content
Hashtags: #story #viral #emotional
Caption: A simple idea that can connect with people.

Analysis:
Score: 68%
Strength: The idea is emotional and relatable.
Weakness: The hook can be more specific.
Improve: Start with stronger curiosity or shock.`;
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
