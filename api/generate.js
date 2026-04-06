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
        "reel", "hai", "ho", "kya", "kyu", "aisa", "aur", "bhi",
        "emotional", "sad"
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

        return normalizeSpaces(t) || "garib kisan";
      }

      if (lang === "ar") {
        return normalizeSpaces(t) || "قصة مؤثرة";
      }

      t = t
        .replace(/\b(create|make|give|write|generate|viral|seo|caption|hook|script|full pack|full package)\b/gi, " ")
        .replace(/\b(video|story|reel|short|ad)\b/gi, " ")
        .replace(/[^\w\s]/g, " ");

      return normalizeSpaces(t) || "powerful story";
    }

    const lang = detectLanguage(safeIdea);
    const tone = detectTone(safeIdea);
    const coreTopic = cleanupTopic(safeIdea, lang);

    function buildFallback() {
      if (lang === "hi") {
        let hook = `Ek aisi kahani jahan ${coreTopic} ka dard seedha dil tak pahunchta hai.`;
        if (tone === "motivational") {
          hook = `Jab halat haar manwane lagen, tabhi ${coreTopic} ki asli kahani shuru hoti hai.`;
        } else if (tone === "funny") {
          hook = `${coreTopic} se judi ek chhoti si baat kaise poora scene ulta kar deti hai, yahi is content ki taqat hai.`;
        } else if (tone === "emotional") {
          hook = `Ek aisi kahani jahan dard itna gehra hai ki dekhne wala chup ho jaye.`;
        }

        return `Title:
- ${coreTopic} Ki Anokhi Kahani
- ${coreTopic} Ka Sangharsh
- ${coreTopic} Ki Ankahi Dastaan

Hook:
- ${hook}

Script:
- Shuruaat ek aise pal se hoti hai jo turant dhyan kheench leta hai.
- Beech me dard, sangharsh aur emotion kahani ko aur gehra bana dete hain.
- Aakhir me ek aisa mod aata hai jo content ko yaadgar bana sakta hai.

SEO:
Keywords: ${coreTopic} story, ${coreTopic} sangharsh, emotional short video
Hashtags: #viral #story #content
Caption: Ek aisi kahani jo sahi presentation ke saath dil ko chhoo sakti hai.

Analysis:
Viral Score: 78%
Strength: Emotional pull strong hai.
Weakness: Hook aur specific ho sakta hai.
Missing: Opening visual aur stronger ho sakta hai.
Improve: Pehle 2 second me shock ya contrast jodo.`;
      }

      if (lang === "ar") {
        return `Title:
- قصة ${coreTopic}
- صراع ${coreTopic}
- الحكاية غير المروية لـ ${coreTopic}

Hook:
- هناك وجع خفي وراء ${coreTopic} يمكنه أن يوقف المشاهد من أول لحظة.

Script:
- تبدأ القصة بلحظة قوية تجذب الانتباه بسرعة.
- وجود الألم أو الصراع يجعل المحتوى أكثر تأثيرًا.
- النهاية تضيف تحولًا يجعل الفكرة أكثر تذكرًا.

SEO:
Keywords: ${coreTopic}, قصة مؤثرة, فيديو قصير
Hashtags: #قصة #ترند #محتوى
Caption: فكرة بسيطة لكنها قادرة على لمس القلوب.

Analysis:
Viral Score: 72%
Strength: الفكرة قريبة من الجمهور.
Weakness: الخطاف يحتاج قوة أكبر.
Missing: عنصر فضول أقوى في البداية.
Improve: ابدأ بجملة أكثر صدمة أو فضولًا.`;
      }

      return `Title:
- The Story of ${coreTopic}
- The Struggle Behind ${coreTopic}
- The Untold Side of ${coreTopic}

Hook:
- A hidden truth behind ${coreTopic} that can stop viewers instantly.

Script:
- The opening starts with a moment strong enough to grab attention fast.
- The emotion and conflict make the story more watchable and memorable.
- The ending adds a turn that can leave a stronger impact.

SEO:
Keywords: ${coreTopic}, emotional story, short video
Hashtags: #viral #story #content
Caption: A simple idea that can hit harder with strong presentation.

Analysis:
Viral Score: 72%
Strength: The idea is relatable and watchable.
Weakness: The hook can be more specific.
Missing: A stronger curiosity trigger is missing at the start.
Improve: Start with more surprise, contrast, or emotion.`;
    }

    const languageInstruction =
      lang === "hi"
        ? "Reply ONLY in natural Hinglish matching the user's input style."
        : lang === "ar"
        ? "Reply ONLY in Arabic."
        : "Reply ONLY in English.";

    const prompt = `
${languageInstruction}

You are a viral content expert.

STRICT RULES:
- No greeting
- No intro
- Never say "Sazio AI here"
- Never say "Let's craft"
- No placeholder text
- No generic lines like "this idea can do well"
- Keep output natural, specific, visual, and usable
- Use the topic naturally
- Hook must feel scroll-stopping
- Fill every section
- Do not write anything outside the exact format

Topic: ${coreTopic}
Original idea: ${safeIdea}
Type: ${safeType}
Need: ${safeOutput}

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
Viral Score: ...
Strength: ...
Weakness: ...
Missing: ...
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
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 650
          }
        })
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      return res.status(200).json({ result: buildFallback() });
    }

    if (!response.ok) {
      return res.status(500).json({
        result: "AI ERROR: " + JSON.stringify(data)
      });
    }

    let raw = "";
    try {
      raw = data.candidates[0].content.parts
        .map((p) => p.text || "")
        .join("\n");
    } catch (e) {
      raw = "";
    }

    if (!raw || !raw.trim()) {
      return res.status(200).json({ result: buildFallback() });
    }

    raw = raw
      .replace(/^Sazio AI.*$/gim, "")
      .replace(/^Let's craft.*$/gim, "")
      .replace(/^Here.*$/gim, "")
      .replace(/^Sure.*$/gim, "")
      .replace(/^Absolutely.*$/gim, "")
      .replace(/^Of course.*$/gim, "")
      .trim();

    if (!raw) {
      return res.status(200).json({ result: buildFallback() });
    }

    return res.status(200).json({
      result: raw
    });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
