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

      const t = text.toLowerCase();

      const romanHindiWords = [
        "ek", "ki", "ka", "ke", "kisan", "kahani", "story", "bnao", "banao",
        "garib", "ladka", "ladki", "maa", "pita", "gaon", "dard", "sangharsh",
        "mehnat", "safalta", "rona", "emotional", "hindi", "reel", "short",
        "video", "bhi", "aur", "hai", "ho", "kyu", "kya", "aisa", "waise"
      ];

      let matchCount = 0;
      for (const word of romanHindiWords) {
        if (t.includes(word)) matchCount++;
      }

      if (matchCount >= 3) return "hi";
      return "en";
    }

    function detectTone(text) {
      const t = text.toLowerCase();

      if (
        t.includes("funny") ||
        t.includes("comedy") ||
        t.includes("meme") ||
        t.includes("मजेदार") ||
        t.includes("कॉमेडी")
      ) {
        return "funny";
      }

      if (
        t.includes("motivation") ||
        t.includes("success") ||
        t.includes("inspire") ||
        t.includes("मेहनत") ||
        t.includes("सफलता") ||
        t.includes("प्रेरणा")
      ) {
        return "motivational";
      }

      if (
        t.includes("sad") ||
        t.includes("emotional") ||
        t.includes("गरीब") ||
        t.includes("garib") ||
        t.includes("दर्द") ||
        t.includes("sangharsh") ||
        t.includes("संघर्ष")
      ) {
        return "emotional";
      }

      return "general";
    }

    const lang = detectLanguage(safeIdea);
    const tone = detectTone(safeIdea);

    function buildFallback() {
      if (lang === "hi") {
        let hook = "क्या आपने कभी सोचा है कि एक साधारण सी जिंदगी के पीछे कितनी गहरी कहानी छिपी हो सकती है?";
        let score = "72%";
        let strength = "Idea emotional aur relatable hai.";
        let weakness = "Hook aur specific ho sakta hai.";
        let missing = "Shuruaat me aur strong curiosity missing hai.";
        let improve = "Pehle 2 second me shock ya emotional contrast jodo.";

        if (tone === "motivational") {
          hook = "जब हालात हार मानने को कहें, तभी असली कहानी शुरू होती है।";
          score = "75%";
          strength = "Idea inspiring aur audience-friendly hai.";
          weakness = "Transformation aur strong ho sakta hai.";
          missing = "Clear before-after moment missing hai.";
          improve = "Struggle ke baad visible result dikhana chahiye.";
        } else if (tone === "funny") {
          hook = "एक छोटी सी बात कैसे पूरे scene को उल्टा कर देती है, यही इस idea की ताकत है।";
          score = "69%";
          strength = "Idea light aur entertaining hai.";
          weakness = "Punchline aur sharper ho sakti hai.";
          missing = "Unexpected comedy twist missing hai.";
          improve = "End me funny reversal add karo.";
        }

        return `Title:
- ${safeIdea} की असरदार कहानी
- ${safeIdea} का संघर्ष
- ${safeIdea} की अनकही दास्तान

Hook:
- ${hook}

Script:
- यह idea शुरुआत से ही लोगों का ध्यान खींच सकता है।
- इसमें भावना, संघर्ष और curiosity का अच्छा मेल है।
- अगर opening aur strong ho, to ye content aur बेहतर perform कर सकता है।

SEO:
Keywords: ${safeIdea}, viral story, short video
Hashtags: #viral #story #content
Caption: एक ऐसा idea जो सही presentation के साथ strong perform कर सकता है।

Analysis:
Viral Score: ${score}
Strength: ${strength}
Weakness: ${weakness}
Missing: ${missing}
Improve: ${improve}`;
      }

      if (lang === "ar") {
        return `Title:
- قصة مؤثرة عن ${safeIdea}
- صراع ${safeIdea}
- الحكاية غير المروية لـ ${safeIdea}

Hook:
- هل فكرت يومًا كم المشاعر أو الصراع المخفي وراء هذه الفكرة؟

Script:
- تبدأ هذه الفكرة بطريقة يمكنها جذب الانتباه بسرعة.
- وجود الصراع والمشاعر يجعلها مناسبة للمحتوى القصير.
- مع بداية أقوى يمكن أن تحقق أداء أفضل.

SEO:
Keywords: ${safeIdea}, قصة مؤثرة, فيديو قصير
Hashtags: #قصة #ترند #محتوى
Caption: فكرة بسيطة لكنها قادرة على جذب الانتباه.

Analysis:
Viral Score: 72%
Strength: الفكرة قريبة من الجمهور.
Weakness: الخطاف يحتاج قوة أكبر.
Missing: عنصر فضول أقوى في البداية.
Improve: ابدأ بجملة أكثر صدمة أو فضولًا.`;
      }

      return `Title:
- The untold story of ${safeIdea}
- The struggle behind ${safeIdea}
- A powerful short about ${safeIdea}

Hook:
- Have you ever thought about how much hidden struggle or emotion can exist behind this idea?

Script:
- This idea can grab attention with a stronger opening.
- The emotional and curiosity angle gives it short-form potential.
- With a sharper first line, it can perform better.

SEO:
Keywords: ${safeIdea}, viral story, short video
Hashtags: #viral #story #content
Caption: A simple idea that can perform better with stronger presentation.

Analysis:
Viral Score: 72%
Strength: The idea is relatable and watchable.
Weakness: The hook can be more specific.
Missing: A stronger curiosity trigger at the start.
Improve: Start with more surprise, contrast, or emotion.`;
    }

    const languageInstruction =
      lang === "hi"
        ? "Reply ONLY in Hindi or natural Hinglish matching the user's input style."
        : lang === "ar"
        ? "Reply ONLY in Arabic."
        : "Reply ONLY in English.";

    const prompt = `
${languageInstruction}

You are Sazio AI, an honest creator assistant.

STRICT RULES:
- No greeting
- No intro
- No fake promises like "100% viral"
- No placeholder text
- No incomplete lines
- Keep every line complete
- Keep output short, useful, and real
- If the user wrote in Roman Hindi/Hinglish, reply in Roman Hindi/Hinglish, not English
- Hook should be strong and complete
- Fill every section

User idea: ${safeIdea}
Content type: ${safeType}
User wants: ${safeOutput}

Return EXACTLY in this format:

TITLE1: short title
TITLE2: short title
TITLE3: short title
HOOK: one complete strong hook
SCRIPT1: short line
SCRIPT2: short line
SCRIPT3: short line
KEYWORDS: keyword1, keyword2, keyword3
HASHTAGS: #tag1 #tag2 #tag3
CAPTION: short caption
SCORE: realistic percentage
STRENGTH: one short strength
WEAKNESS: one short weakness
MISSING: one short missing element
IMPROVE: one short improvement

Do not write anything outside these lines.
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
            temperature: 0.45,
            maxOutputTokens: 520
          }
        })
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      return res.status(200).json({
        result: buildFallback()
      });
    }

    if (!response.ok) {
      return res.status(500).json({
        result: "AI ERROR: " + JSON.stringify(data)
      });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw || !raw.trim()) {
      return res.status(200).json({
        result: buildFallback()
      });
    }

    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    function getValue(prefix, fallback) {
      const line = lines.find((l) => l.toUpperCase().startsWith(prefix));
      if (!line) return fallback;
      const value = line.slice(prefix.length).trim();
      return value || fallback;
    }

    const defaults =
      lang === "hi"
        ? {
            title1: `${safeIdea} की असरदार कहानी`,
            title2: `${safeIdea} का संघर्ष`,
            title3: `${safeIdea} की अनकही दास्तान`,
            hook: "क्या आपने कभी सोचा है कि इस idea के पीछे कितनी गहरी कहानी छिपी हो सकती है?",
            script1: "यह idea शुरुआत से ही लोगों का ध्यान खींच सकता है।",
            script2: "इसमें भावना, संघर्ष और curiosity का अच्छा मेल है।",
            script3: "बेहतर opening ke saath ye aur strong perform kar sakta hai.",
            keywords: `${safeIdea}, viral story, short video`,
            hashtags: `#viral #story #content`,
            caption: `एक ऐसा idea जो सही presentation के साथ strong perform कर सकता है।`,
            score: `72%`,
            strength: `Idea emotional aur relatable hai.`,
            weakness: `Hook aur specific ho sakta hai.`,
            missing: `Shuruaat me strong curiosity missing hai.`,
            improve: `Pehle 2 second me shock ya contrast jodo.`
          }
        : lang === "ar"
        ? {
            title1: `قصة مؤثرة عن ${safeIdea}`,
            title2: `صراع ${safeIdea}`,
            title3: `الحكاية غير المروية لـ ${safeIdea}`,
            hook: `هل فكرت يومًا كم المشاعر أو الصراع المخفي وراء هذه الفكرة؟`,
            script1: `تبدأ هذه الفكرة بطريقة يمكنها جذب الانتباه بسرعة.`,
            script2: `وجود الصراع والمشاعر يجعلها مناسبة للمحتوى القصير.`,
            script3: `مع بداية أقوى يمكن أن تحقق أداء أفضل.`,
            keywords: `${safeIdea}, قصة مؤثرة, فيديو قصير`,
            hashtags: `#قصة #ترند #محتوى`,
            caption: `فكرة بسيطة لكنها قادرة على جذب الانتباه.`,
            score: `72%`,
            strength: `الفكرة قريبة من الجمهور.`,
            weakness: `الخطاف يحتاج قوة أكبر.`,
            missing: `عنصر فضول أقوى في البداية.`,
            improve: `ابدأ بجملة أكثر صدمة أو فضولًا.`
          }
        : {
            title1: `The untold story of ${safeIdea}`,
            title2: `The struggle behind ${safeIdea}`,
            title3: `A powerful short about ${safeIdea}`,
            hook: `Have you ever thought about how much hidden struggle or emotion can exist behind this idea?`,
            script1: `This idea can grab attention with a stronger opening.`,
            script2: `The emotional and curiosity angle gives it short-form potential.`,
            script3: `With a sharper first line, it can perform better.`,
            keywords: `${safeIdea}, viral story, short video`,
            hashtags: `#viral #story #content`,
            caption: `A simple idea that can perform better with stronger presentation.`,
            score: `72%`,
            strength: `The idea is relatable and watchable.`,
            weakness: `The hook can be more specific.`,
            missing: `A stronger curiosity trigger at the start.`,
            improve: `Start with more surprise, contrast, or emotion.`
          };

    const title1 = getValue("TITLE1:", defaults.title1);
    const title2 = getValue("TITLE2:", defaults.title2);
    const title3 = getValue("TITLE3:", defaults.title3);
    const hook = getValue("HOOK:", defaults.hook);
    const script1 = getValue("SCRIPT1:", defaults.script1);
    const script2 = getValue("SCRIPT2:", defaults.script2);
    const script3 = getValue("SCRIPT3:", defaults.script3);
    const keywords = getValue("KEYWORDS:", defaults.keywords);
    const hashtags = getValue("HASHTAGS:", defaults.hashtags);
    const caption = getValue("CAPTION:", defaults.caption);
    const score = getValue("SCORE:", defaults.score);
    const strength = getValue("STRENGTH:", defaults.strength);
    const weakness = getValue("WEAKNESS:", defaults.weakness);
    const missing = getValue("MISSING:", defaults.missing);
    const improve = getValue("IMPROVE:", defaults.improve);

    const finalText = `Title:
- ${title1}
- ${title2}
- ${title3}

Hook:
- ${hook}

Script:
- ${script1}
- ${script2}
- ${script3}

SEO:
Keywords: ${keywords}
Hashtags: ${hashtags}
Caption: ${caption}

Analysis:
Viral Score: ${score}
Strength: ${strength}
Weakness: ${weakness}
Missing: ${missing}
Improve: ${improve}`;

    return res.status(200).json({
      result: finalText
    });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
