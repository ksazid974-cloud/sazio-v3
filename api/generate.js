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
    const safeType =
      typeof type === "string" && type.trim() ? type.trim() : "content";
    const safeOutput =
      typeof output === "string" && output.trim()
        ? output.trim()
        : "title, hook, script, SEO, analysis";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea required" });
    }

    function normalizeSpaces(text) {
      return String(text || "").replace(/\s+/g, " ").trim();
    }

    function detectLanguage(text) {
      if (/[\u0900-\u097F]/.test(text)) return "hi";
      if (/[\u0600-\u06FF]/.test(text)) return "ar";

      const t = String(text).toLowerCase();
      const romanHindiWords = [
        "ek", "ki", "ka", "ke", "kisan", "kahani", "story", "bnao", "banao",
        "garib", "gaon", "dard", "sangharsh", "mehnat", "safalta",
        "ladka", "ladki", "maa", "pita", "rona", "video", "short",
        "reel", "hai", "ho", "kya", "kyu", "aisa", "aur", "bhi"
      ];

      let matchCount = 0;
      for (const word of romanHindiWords) {
        if (t.includes(word)) matchCount++;
      }

      return matchCount >= 3 ? "hi" : "en";
    }

    function detectTone(text) {
      const t = String(text).toLowerCase();

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

    function removeDuplicateWords(text) {
      const words = normalizeSpaces(text).split(" ");
      const result = [];

      for (const word of words) {
        const prev = result[result.length - 1];
        if (!prev || prev.toLowerCase() !== word.toLowerCase()) {
          result.push(word);
        }
      }

      return result.join(" ");
    }

    function cleanupTopic(text, lang) {
      let t = String(text || "").trim();

      if (lang === "hi") {
        t = t
          .replace(/\b(please|plz|idea|content|viral|seo|caption|hook|script|full pack|full package)\b/gi, " ")
          .replace(/\b(video|reel|short|ad)\b/gi, " ")
          .replace(/\b(story|kahani)\s*(bnao|banao|do|de|likho)?\b/gi, " ")
          .replace(/\b(bnao|banao|do|de|likho)\b/gi, " ")
          .replace(/\b(ek)\b/gi, " ")
          .replace(/\b(ki|ka|ke)\b\s*$/gi, " ")
          .replace(/[^\w\u0900-\u097F\s]/g, " ");

        t = normalizeSpaces(t);
        t = removeDuplicateWords(t);

        return t || "garib kisan";
      }

      if (lang === "ar") {
        return normalizeSpaces(t) || "قصة مؤثرة";
      }

      t = t
        .replace(/\b(create|make|give|write|generate|viral|seo|caption|hook|script|full pack|full package)\b/gi, " ")
        .replace(/\b(video|story|reel|short|ad)\b/gi, " ")
        .replace(/[^\w\s]/g, " ");

      t = normalizeSpaces(t);
      t = removeDuplicateWords(t);

      return t || "powerful story";
    }

    function toTitleCaseSimple(text) {
      return normalizeSpaces(text)
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    function buildKeywords(topic, lang) {
      if (lang === "hi") {
        const clean = normalizeSpaces(
          topic.replace(/\b(ki|ka|ke)\b/gi, " ")
        );
        return `${clean} story, ${clean} sangharsh, emotional short video`;
      }

      if (lang === "ar") {
        return `${topic}, قصة مؤثرة, فيديو قصير`;
      }

      return `${topic}, emotional story, short video`;
    }

    const lang = detectLanguage(safeIdea);
    const tone = detectTone(safeIdea);
    const coreTopic = cleanupTopic(safeIdea, lang);

    function buildDefaults() {
      if (lang === "hi") {
        let hook = `Kya aapne kabhi socha hai ki ${coreTopic} ke peeche kitni gehri kahani chhipi ho sakti hai?`;
        let score = "72%";
        let strength = "Idea relatable aur emotionally engaging hai.";
        let weakness = "Hook aur specific ho sakta hai.";
        let missing = "Shuruaat me stronger curiosity missing hai.";
        let improve = "Pehle 2 second me shock ya contrast jodo.";

        if (tone === "motivational") {
          hook = `Jab halat haar manwane lagen, tabhi ${coreTopic} ki asli kahani shuru hoti hai.`;
          score = "75%";
          strength = "Idea inspiring aur audience-friendly hai.";
          weakness = "Transformation aur stronger ho sakta hai.";
          missing = "Before-after impact missing hai.";
          improve = "Struggle ke baad visible result aur clear dikhao.";
        } else if (tone === "funny") {
          hook = `${coreTopic} se judi ek chhoti si baat kaise poora scene ulta kar deti hai, yahi is content ki taqat hai.`;
          score = "69%";
          strength = "Idea light aur entertaining hai.";
          weakness = "Punchline aur sharper ho sakti hai.";
          missing = "Unexpected comedy twist missing hai.";
          improve = "End me funny reversal add karo.";
        }

        return {
          title1: `${toTitleCaseSimple(coreTopic)} Ki Anokhi Kahani`,
          title2: `${toTitleCaseSimple(coreTopic)} Ka Sangharsh`,
          title3: `${toTitleCaseSimple(coreTopic)} Ki Ankahi Dastaan`,
          hook,
          script1: `Yeh idea shuruaat se hi logon ka dhyan kheench sakta hai.`,
          script2: `Isme bhavna, sangharsh aur curiosity ka achha mel hai.`,
          script3: `Better opening ke saath yeh content aur strong perform kar sakta hai.`,
          keywords: buildKeywords(coreTopic, lang),
          hashtags: `#viral #story #content`,
          caption: `Ek aisa idea jo sahi presentation ke saath strong perform kar sakta hai.`,
          score,
          strength,
          weakness,
          missing,
          improve
        };
      }

      if (lang === "ar") {
        return {
          title1: `قصة ${coreTopic}`,
          title2: `صراع ${coreTopic}`,
          title3: `الحكاية غير المروية لـ ${coreTopic}`,
          hook: `هل فكرت يومًا كم المشاعر أو الصراع المخفي وراء ${coreTopic}؟`,
          script1: `تبدأ هذه الفكرة بطريقة يمكنها جذب الانتباه بسرعة.`,
          script2: `وجود الصراع والمشاعر يجعلها مناسبة للمحتوى القصير.`,
          script3: `مع بداية أقوى يمكن أن تحقق أداء أفضل.`,
          keywords: buildKeywords(coreTopic, lang),
          hashtags: `#قصة #ترند #محتوى`,
          caption: `فكرة بسيطة لكنها قادرة على جذب الانتباه.`,
          score: `72%`,
          strength: `الفكرة قريبة من الجمهور.`,
          weakness: `الخطاف يحتاج قوة أكبر.`,
          missing: `عنصر فضول أقوى في البداية.`,
          improve: `ابدأ بجملة أكثر صدمة أو فضولًا.`
        };
      }

      return {
        title1: `The Story of ${toTitleCaseSimple(coreTopic)}`,
        title2: `The Struggle Behind ${toTitleCaseSimple(coreTopic)}`,
        title3: `The Untold Side of ${toTitleCaseSimple(coreTopic)}`,
        hook: `Have you ever thought about how much hidden struggle or emotion can exist behind ${coreTopic}?`,
        script1: `This idea can grab attention with a stronger opening.`,
        script2: `The emotional and curiosity angle gives it short-form potential.`,
        script3: `With a sharper first line, it can perform better.`,
        keywords: buildKeywords(coreTopic, lang),
        hashtags: `#viral #story #content`,
        caption: `A simple idea that can perform better with stronger presentation.`,
        score: `72%`,
        strength: `The idea is relatable and watchable.`,
        weakness: `The hook can be more specific.`,
        missing: `A stronger curiosity trigger is missing at the start.`,
        improve: `Start with more surprise, contrast, or emotion.`
      };
    }

    const defaults = buildDefaults();

    function buildFallback() {
      return `Title:
- ${defaults.title1}
- ${defaults.title2}
- ${defaults.title3}

Hook:
- ${defaults.hook}

Script:
- ${defaults.script1}
- ${defaults.script2}
- ${defaults.script3}

SEO:
Keywords: ${defaults.keywords}
Hashtags: ${defaults.hashtags}
Caption: ${defaults.caption}

Analysis:
Viral Score: ${defaults.score}
Strength: ${defaults.strength}
Weakness: ${defaults.weakness}
Missing: ${defaults.missing}
Improve: ${defaults.improve}`;
    }

    const languageInstruction =
      lang === "hi"
        ? "Reply ONLY in Hindi or natural Hinglish matching the user's input style. If the user wrote in Roman Hindi/Hinglish, reply in Roman Hindi/Hinglish, not English."
        : lang === "ar"
        ? "Reply ONLY in Arabic."
        : "Reply ONLY in English.";

    const prompt = `
${languageInstruction}

You are Sazio AI, an honest creator assistant.

STRICT RULES:
- No greeting
- No intro
- No fake promises
- No placeholder text
- No incomplete lines
- Keep every line complete
- Keep output short, useful, and natural
- Do not repeat command words like "story bnao" in titles
- Use the main topic naturally
- Hook should be strong and complete
- Fill every section

Main topic: ${coreTopic}
Original user idea: ${safeIdea}
Content type: ${safeType}
User wants: ${safeOutput}

Return EXACTLY in this format:

TITLE1: short natural title
TITLE2: short natural title
TITLE3: short natural title
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
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.35,
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

    function cleanValue(value, fallback) {
      const badPatterns = [
        /^strong title/i,
        /^script line/i,
        /^keyword\d/i,
        /^#tag\d/i,
        /^short caption$/i,
        /^a strong hook$/i
      ];

      if (!value) return fallback;

      let cleaned = normalizeSpaces(value);
      cleaned = cleaned.replace(/\b(ki|ka|ke)\s+\1\b/gi, "$1");
      cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, "$1");
      cleaned = normalizeSpaces(cleaned);

      if (!cleaned) return fallback;
      if (badPatterns.some((p) => p.test(cleaned))) return fallback;

      return cleaned;
    }

    const title1 = cleanValue(getValue("TITLE1:", defaults.title1), defaults.title1);
    const title2 = cleanValue(getValue("TITLE2:", defaults.title2), defaults.title2);
    const title3 = cleanValue(getValue("TITLE3:", defaults.title3), defaults.title3);
    const hook = cleanValue(getValue("HOOK:", defaults.hook), defaults.hook);
    const script1 = cleanValue(getValue("SCRIPT1:", defaults.script1), defaults.script1);
    const script2 = cleanValue(getValue("SCRIPT2:", defaults.script2), defaults.script2);
    const script3 = cleanValue(getValue("SCRIPT3:", defaults.script3), defaults.script3);
    const keywords = cleanValue(getValue("KEYWORDS:", defaults.keywords), defaults.keywords);
    const hashtags = cleanValue(getValue("HASHTAGS:", defaults.hashtags), defaults.hashtags);
    const caption = cleanValue(getValue("CAPTION:", defaults.caption), defaults.caption);
    const score = cleanValue(getValue("SCORE:", defaults.score), defaults.score);
    const strength = cleanValue(getValue("STRENGTH:", defaults.strength), defaults.strength);
    const weakness = cleanValue(getValue("WEAKNESS:", defaults.weakness), defaults.weakness);
    const missing = cleanValue(getValue("MISSING:", defaults.missing), defaults.missing);
    const improve = cleanValue(getValue("IMPROVE:", defaults.improve), defaults.improve);

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
