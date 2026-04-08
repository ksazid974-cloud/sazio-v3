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
    const safeType = typeof type === "string" && type.trim() ? type.trim() : "video";
    const safeOutput =
      typeof output === "string" && output.trim()
        ? output.trim()
        : "script, hook, SEO, analysis, translation, compare, earning idea";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea required" });
    }

    function normalize(text) {
      return String(text || "").replace(/\s+/g, " ").trim();
    }

    function detectLanguage(text) {
      if (/[\u0900-\u097F]/.test(text)) return "hi-dev";
      if (/[\u0600-\u06FF]/.test(text)) return "ar";

      const t = String(text).toLowerCase();
      const romanHindiWords = [
        "ek", "ki", "ka", "ke", "kahani", "story", "bnao", "banao",
        "garib", "kisan", "jadugar", "rona", "dard", "sangharsh",
        "video", "short", "reel", "hai", "ho", "kya", "kyu",
        "emotional", "movie", "serial", "web series", "affiliate",
        "freelance", "cricket", "stock", "translation", "compare", "earning"
      ];

      let score = 0;
      for (const word of romanHindiWords) {
        if (t.includes(word)) score++;
      }
      return score >= 3 ? "hi-roman" : "en";
    }

    function cleanupTopic(text) {
      return normalize(text)
        .replace(/\b(please|plz|script|hook|seo|analysis|caption|full pack|full package)\b/gi, " ")
        .replace(/\b(bnao|banao|do|de|likho|generate)\b/gi, " ")
        .replace(/\b(video|story|ad|serial|movie|web series|webseries)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function smartHindiTopic(topic, lang) {
      let t = normalize(topic);

      if (lang === "hi-dev" || lang === "hi-roman") {
        t = t
          .replace(/\bek\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
      }

      return t || "idea";
    }

    function buildLanguageInstruction(lang) {
      if (lang === "hi-dev") {
        return "Reply mainly in Hindi using Devanagari script. Avoid unnecessary English.";
      }
      if (lang === "hi-roman") {
        return "Reply only in natural Roman Hindi / Hinglish. Avoid full English.";
      }
      if (lang === "ar") {
        return "Reply only in Arabic.";
      }
      return "Reply only in English.";
    }

    function buildModeInstruction(mode) {
      const map = {
        video: "Create short-form video content output.",
        story: "Create story-focused output.",
        ad: "Create ad-focused output.",
        serial: "Create serial/drama style output.",
        movie: "Create movie concept output.",
        webseries: "Create web series concept output.",
        affiliate: "Create safe legal affiliate-style creator output.",
        freelance: "Create safe legal freelance-oriented output.",
        cricket: "Create cricket-focused content output.",
        stockmarket: "Create safe educational stock-market style output with no guarantees.",
        translator: "Include a clear translation-oriented response in the same structure.",
        pricecomparison: "Create safe comparison-oriented output without fake live price claims.",
        aibrain: "Act as a multi-purpose AI brain and solve the request in structured form."
      };
      return map[mode] || map.video;
    }

    function buildPrompt(userIdea, mode, userNeed, lang, topic) {
      return `
${buildLanguageInstruction(lang)}

You are Sazio AI.

${buildModeInstruction(mode)}

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No code fences
- No intro
- No explanation outside JSON
- No fake promises
- No generic filler
- Keep output short, clean, useful, and structured
- titles must be exactly 3
- script must be exactly 3 complete lines
- seo.keywords must be exactly 3
- seo.hashtags must be exactly 3
- analysis must stay honest
- Titles must NOT repeat the full user input line
- Use the main cleaned topic naturally
- If user asks for story, make the 3 script lines feel like actual story progression, not generic placeholders
- Keep earning, comparison, affiliate, freelance, and stock-related output legal, safe, and non-misleading

User idea: ${userIdea}
Main topic: ${topic}
Mode: ${mode}
Need: ${userNeed}

Return EXACT JSON:
{
  "titles": ["...", "...", "..."],
  "hook": "...",
  "script": ["...", "...", "..."],
  "seo": {
    "keywords": ["...", "...", "..."],
    "hashtags": ["#...", "#...", "#..."],
    "caption": "..."
  },
  "analysis": {
    "score": "...",
    "strength": "...",
    "weakness": "...",
    "missing": "...",
    "improve": "..."
  }
}
`;
    }

    function fallbackData(topic, mode, lang) {
      const t = topic || "idea";

      if (lang === "hi-dev") {
        return {
          titles: [
            `${t} की अनकही कहानी`,
            `${t} का संघर्ष`,
            `${t} का सच`
          ],
          hook: `एक ऐसी शुरुआत जो viewers को पहले ही पल रोक सकती है।`,
          script: [
            `${t} की कहानी की शुरुआत एक ऐसे दृश्य से होती है जहाँ मुश्किलें साफ दिखाई देती हैं।`,
            `बीच में संघर्ष, भावना और दबाव बढ़ता है, जिससे कहानी और गहरी बनती है।`,
            `अंत में एक ऐसा मोड़ आता है जो इस कहानी को यादगार बना सकता है।`
          ],
          seo: {
            keywords: [t, `${t} कहानी`, `${mode} content`],
            hashtags: ["#viral", "#story", "#content"],
            caption: `${t} पर based एक ऐसा idea जो सही presentation के साथ strong perform kar sakta hai।`
          },
          analysis: {
            score: "76%",
            strength: "Idea relatable aur engaging hai.",
            weakness: "Hook aur specific ho sakta hai.",
            missing: "Opening visual aur stronger ho sakta hai.",
            improve: "Pehle 2 second me shock, contrast ya curiosity jodo."
          }
        };
      }

      if (lang === "hi-roman") {
        return {
          titles: [
            `${t} ki ankahi kahani`,
            `${t} ka sangharsh`,
            `${t} ka sach`
          ],
          hook: `Ek aisi shuruaat jo viewer ko pehle hi pal rok sakti hai.`,
          script: [
            `${t} ki kahani ki shuruaat ek aise scene se hoti hai jahan mushkilein saaf dikh rahi hoti hain.`,
            `Beech me struggle, emotion aur pressure badhta hai, jis se story aur gehri lagti hai.`,
            `End me ek aisa mod aata hai jo is kahani ko yaadgar bana sakta hai.`
          ],
          seo: {
            keywords: [t, `${t} story`, `${mode} content`],
            hashtags: ["#viral", "#story", "#content"],
            caption: `${t} par based ek aisa idea jo sahi presentation ke saath strong perform kar sakta hai.`
          },
          analysis: {
            score: "76%",
            strength: "Idea relatable aur engaging hai.",
            weakness: "Hook aur specific ho sakta hai.",
            missing: "Opening visual aur stronger ho sakta hai.",
            improve: "Pehle 2 second me shock, contrast ya curiosity jodo."
          }
        };
      }

      if (lang === "ar") {
        return {
          titles: [
            `قصة ${t}`,
            `صراع ${t}`,
            `حقيقة ${t}`
          ],
          hook: `بداية قوية يمكنها إيقاف المشاهد من أول لحظة.`,
          script: [
            `تبدأ القصة بمشهد يوضح الصعوبة أو التوتر منذ البداية.`,
            `في المنتصف يزداد الصراع والتأثير العاطفي بشكل واضح.`,
            `في النهاية يظهر تحول يجعل القصة أكثر تذكرًا وتأثيرًا.`
          ],
          seo: {
            keywords: [t, `${t} story`, `${mode} content`],
            hashtags: ["#viral", "#story", "#content"],
            caption: `فكرة عن ${t} يمكن أن تؤدي بشكل أفضل مع عرض قوي.`
          },
          analysis: {
            score: "76%",
            strength: "الفكرة جذابة وقريبة من الجمهور.",
            weakness: "الخطاف يحتاج تحديدًا أكثر.",
            missing: "افتتاحية أقوى بصريًا.",
            improve: "ابدأ بلقطة أقوى أو عنصر فضول أكبر."
          }
        };
      }

      return {
        titles: [
          `The untold side of ${t}`,
          `The struggle behind ${t}`,
          `The real story of ${t}`
        ],
        hook: `A strong opening that can stop viewers in the first moment.`,
        script: [
          `The story opens with a scene that immediately shows tension or difficulty.`,
          `The middle builds conflict, feeling, and stronger audience connection.`,
          `The ending lands with a turn that makes the content more memorable.`
        ],
        seo: {
          keywords: [t, `${t} story`, `${mode} content`],
          hashtags: ["#viral", "#story", "#content"],
          caption: `A ${t}-based idea that can perform better with stronger presentation.`
        },
        analysis: {
          score: "76%",
          strength: "The idea is relatable and engaging.",
          weakness: "The hook can be more specific.",
          missing: "A stronger opening visual is missing.",
          improve: "Add more shock, contrast, or curiosity in the first 2 seconds."
        }
      };
    }

    function parseJsonSafely(rawText) {
      const cleaned = String(rawText || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch (error) {
        const first = cleaned.indexOf("{");
        const last = cleaned.lastIndexOf("}");
        if (first !== -1 && last !== -1 && last > first) {
          try {
            return JSON.parse(cleaned.slice(first, last + 1));
          } catch (innerError) {
            return null;
          }
        }
        return null;
      }
    }

    function ensureArray(arr, count, fallback) {
      if (!Array.isArray(arr)) return fallback;
      const filtered = arr.map((x) => normalize(x)).filter(Boolean);
      if (!filtered.length) return fallback;
      while (filtered.length < count) {
        filtered.push(fallback[Math.min(filtered.length, fallback.length - 1)]);
      }
      return filtered.slice(0, count);
    }

    function ensureString(value, fallback) {
      const v = normalize(value);
      return v || fallback;
    }

    function cleanupTitles(titles, topic) {
      return titles.map((title, index) => {
        let t = normalize(title);
        if (!t) return title;

        const rawLower = t.toLowerCase();
        const topicLower = String(topic || "").toLowerCase();

        if (topicLower && rawLower === topicLower) {
          const suffixes = ["ki ankahi kahani", "ka sangharsh", "ka sach"];
          return `${topic} ${suffixes[index] || "ki kahani"}`;
        }

        return t;
      });
    }

    function formatOutput(data) {
      return `Title:
- ${data.titles[0]}
- ${data.titles[1]}
- ${data.titles[2]}

Hook:
- ${data.hook}

Script:
- ${data.script[0]}
- ${data.script[1]}
- ${data.script[2]}

SEO:
Keywords: ${data.seo.keywords.join(", ")}
Hashtags: ${data.seo.hashtags.join(" ")}
Caption: ${data.seo.caption}

Analysis:
Viral Score: ${data.analysis.score}
Strength: ${data.analysis.strength}
Weakness: ${data.analysis.weakness}
Missing: ${data.analysis.missing}
Improve: ${data.analysis.improve}`;
    }

    const lang = detectLanguage(safeIdea);
    const topic = smartHindiTopic(cleanupTopic(safeIdea), lang);
    const fallback = fallbackData(topic, safeType, lang);
    const prompt = buildPrompt(safeIdea, safeType, safeOutput, lang, topic);

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
            temperature: 0.4,
            maxOutputTokens: 1200,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        result: formatOutput(fallback)
      });
    }

    let rawText = "";
    try {
      const parts = data?.candidates?.[0]?.content?.parts || [];
      rawText = parts.map((part) => part.text || "").join("\n").trim();
    } catch (error) {
      rawText = "";
    }

    const parsed = parseJsonSafely(rawText);

    if (!parsed) {
      return res.status(200).json({
        result: formatOutput(fallback)
      });
    }

    const finalData = {
      titles: cleanupTitles(
        ensureArray(parsed.titles, 3, fallback.titles),
        topic
      ),
      hook: ensureString(parsed.hook, fallback.hook),
      script: ensureArray(parsed.script, 3, fallback.script),
      seo: {
        keywords: ensureArray(parsed?.seo?.keywords, 3, fallback.seo.keywords),
        hashtags: ensureArray(parsed?.seo?.hashtags, 3, fallback.seo.hashtags),
        caption: ensureString(parsed?.seo?.caption, fallback.seo.caption)
      },
      analysis: {
        score: ensureString(parsed?.analysis?.score, fallback.analysis.score),
        strength: ensureString(parsed?.analysis?.strength, fallback.analysis.strength),
        weakness: ensureString(parsed?.analysis?.weakness, fallback.analysis.weakness),
        missing: ensureString(parsed?.analysis?.missing, fallback.analysis.missing),
        improve: ensureString(parsed?.analysis?.improve, fallback.analysis.improve)
      }
    };

    return res.status(200).json({
      result: formatOutput(finalData)
    });
  } catch (error) {
    return res.status(500).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
