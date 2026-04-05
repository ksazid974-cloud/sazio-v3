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
        t.includes("dark") ||
        t.includes("sad") ||
        t.includes("emotional") ||
        t.includes("गरीब") ||
        t.includes("संघर्ष") ||
        t.includes("दर्द") ||
        t.includes("रोना")
      ) {
        return "emotional";
      }

      return "general";
    }

    function wantsFullPack(text) {
      const t = text.toLowerCase();
      return (
        t.includes("full") ||
        t.includes("all") ||
        t.includes("caption") ||
        t.includes("thumbnail") ||
        t.includes("hashtags") ||
        t.includes("full pack") ||
        t.includes("पूरा") ||
        t.includes("सब कुछ")
      );
    }

    function buildFallback(text, contentType, userWant) {
      const lang = detectLanguage(text);
      const tone = detectTone(text);
      const fullPack = wantsFullPack(userWant);

      if (lang === "hi") {
        let hook = "क्या आपने कभी सोचा है कि इस idea के पीछे कितनी गहरी कहानी छिपी हो सकती है?";
        let score = "72%";
        let strength = "Idea relatable aur emotional connection create karta hai.";
        let weakness = "Hook aur specific ho sakta hai.";
        let missing = "Strong curiosity ya stronger opening moment missing hai.";
        let improve = "Shuruaat me shock, contrast, ya emotional twist badhao.";
        let platformFit = "YouTube Shorts aur Instagram Reels ke liye better fit.";

        if (tone === "funny") {
          hook = "एक छोटी सी बात कैसे instant comedy chaos बन सकती है, यही इस content की ताकत है।";
          score = "69%";
          strength = "Idea entertaining aur fast-consumption friendly hai.";
          weakness = "Punchline aur sharper ho sakti hai.";
          missing = "Unexpected comic twist missing hai.";
          improve = "Last line me funny reversal ya irony jodo.";
          platformFit = "Instagram Reels aur Facebook short comedy format ke liye fit.";
        } else if (tone === "motivational") {
          hook = "जब हालात हार मानने को कहें, तभी असली कहानी शुरू होती है।";
          score = "75%";
          strength = "Idea inspiring aur emotionally strong hai.";
          weakness = "Outcome aur clearer ho sakta hai.";
          missing = "Before-after impact aur clear transformation missing hai.";
          improve = "Result ko aur visible banao aur struggle ko sharper karo.";
          platformFit = "YouTube Shorts aur motivational short videos ke liye strong fit.";
        }

        let extra = "";
        if (fullPack) {
          extra = `
Caption: एक ऐसा idea जो सही presentation ke saath strong perform kar sakta hai.
Hashtags: #viral #story #content
Thumbnail: क्या आप इसकी सच्चाई जानते हैं?`;
        }

        return `Title:
- ${text} की अनकही कहानी
- ${text} का संघर्ष
- ${text} से जुड़ी एक असरदार दास्तान

Hook:
- ${hook}

Script:
- यह idea शुरुआत से ही ध्यान खींचने की क्षमता रखता है।
- इसमें भावना, संघर्ष और curiosity का अच्छा blend बन सकता है।
- बेहतर opening aur sharper payoff ke saath ye content aur strong perform karega.

SEO:
Keywords: ${text}, viral content, short video
Hashtags: #viral #story #content
Caption: एक ऐसा content idea जो लोगों का ध्यान रोक सकता है.
${extra ? extra : ""}

Analysis:
Viral Score: ${score}
Strengths:
- ${strength}
- Content short format me easily convert ho sakta hai.

Weak Points:
- ${weakness}
- Hook abhi aur aggressive ho sakta hai.

Missing:
- ${missing}
- Strong first 2 seconds ka visual ya line missing hai.

Improvement:
- ${improve}
- Title me aur curiosity add karo.

Platform Fit:
- ${platformFit}
- Short-form audience ke liye yeh zyada natural fit hai.`;
      }

      if (lang === "ar") {
        let extra = "";
        if (fullPack) {
          extra = `
Caption: فكرة مناسبة للمحتوى القصير إذا تم تقديمها بشكل أقوى.
Hashtags: #ترند #قصة #محتوى
Thumbnail: هل تعرف الحقيقة الكاملة؟`;
        }

        return `Title:
- القصة غير المروية عن ${text}
- صراع ${text}
- حكاية مؤثرة عن ${text}

Hook:
- هل فكرت يومًا كم المشاعر أو الصراع المخفي وراء هذه الفكرة؟

Script:
- تبدأ هذه الفكرة بلحظة يمكنها جذب الانتباه بسرعة.
- وجود الصراع أو الفضول يجعلها مناسبة للمحتوى القصير.
- مع بداية أقوى ونهاية أوضح يمكن أن تؤدي بشكل أفضل.

SEO:
Keywords: ${text}, محتوى قصير, فكرة ترند
Hashtags: #ترند #قصة #محتوى
Caption: فكرة بسيطة لكنها قادرة على جذب الانتباه.
${extra ? extra : ""}

Analysis:
Viral Score: 72%
Strengths:
- الفكرة قريبة من الجمهور.
- مناسبة للفيديوهات القصيرة.

Weak Points:
- الخطاف يحتاج أن يكون أقوى.
- النهاية تحتاج وضوحًا أكبر.

Missing:
- عنصر فضول أقوى في البداية.
- سبب أقوى للمشاهدة حتى النهاية.

Improvement:
- ابدأ بجملة أكثر صدمة أو فضولًا.
- اجعل النتيجة أو التحول أوضح.

Platform Fit:
- يوتيوب شورتس وإنستغرام ريلز مناسبين أكثر.
- الفكرة تناسب المحتوى السريع والقصير.`;
      }

      let extra = "";
      if (fullPack) {
        extra = `
Caption: A simple idea that can perform better with stronger presentation.
Hashtags: #viral #story #content
Thumbnail: You won't expect this ending`;
      }

      return `Title:
- The untold story of ${text}
- The struggle behind ${text}
- A powerful short about ${text}

Hook:
- Have you ever thought about how much hidden emotion or struggle can exist behind this idea?

Script:
- This idea can grab attention if it starts with a stronger opening moment.
- The emotional or curiosity angle gives it short-form potential.
- With a sharper payoff, it can perform better across short content platforms.

SEO:
Keywords: ${text}, viral content, short video
Hashtags: #viral #story #content
Caption: A simple idea that can connect with viewers quickly.
${extra ? extra : ""}

Analysis:
Viral Score: 72%
Strengths:
- The idea is relatable.
- It fits short-form content.

Weak Points:
- The hook can be more specific.
- The ending can be stronger.

Missing:
- A stronger curiosity trigger at the start.
- A more memorable payoff.

Improvement:
- Start with surprise, contrast, or emotion.
- Make the title more curiosity-driven.

Platform Fit:
- Best fit for YouTube Shorts and Instagram Reels.
- The format works better in fast, scroll-stopping content.`;
    }

    const fullPack = wantsFullPack(safeOutput);

    const prompt = `
Reply ONLY in the SAME language as the user's idea.

You are Sazio AI, an honest creator assistant.

STRICT RULES:
- No greeting
- No intro
- No fake promise like "100% viral"
- No placeholder text
- No incomplete lines
- Keep output compact, real, and practical
- Hook must be stronger than normal generic content
- Titles should be clickable, curiosity-driven, or emotional
- Analysis must be honest, not scammy
- Fill every section

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
${fullPack ? "Thumbnail: ..." : ""}

Analysis:
Viral Score: ...
Strengths:
- ...
- ...

Weak Points:
- ...
- ...

Missing:
- ...
- ...

Improvement:
- ...
- ...

Platform Fit:
- ...
- ...
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
            maxOutputTokens: 720
          }
        })
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      return res.status(200).json({
        result: buildFallback(safeIdea, safeType, safeOutput)
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
        result: buildFallback(safeIdea, safeType, safeOutput)
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
        result: buildFallback(safeIdea, safeType, safeOutput)
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
