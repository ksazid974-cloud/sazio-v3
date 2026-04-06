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
    const safeOutput = typeof output === "string" ? output.trim() : "";

    if (!safeIdea) {
      return res.status(400).json({ result: "Idea required" });
    }

    function normalize(text) {
      return String(text || "").replace(/\s+/g, " ").trim();
    }

    function detectLanguage(text) {
      if (/[\u0900-\u097F]/.test(text)) return "hi";
      if (/[\u0600-\u06FF]/.test(text)) return "ar";

      const t = String(text).toLowerCase();
      const romanHindiWords = [
        "ek", "ki", "ka", "ke", "kahani", "story", "bnao", "banao", "garib",
        "dard", "sangharsh", "mehnat", "rona", "video", "short", "reel",
        "hai", "ho", "kya", "kyu", "aisa", "aur", "emotional", "jadugar",
        "kisan", "movie", "serial", "web series"
      ];

      let score = 0;
      for (const word of romanHindiWords) {
        if (t.includes(word)) score++;
      }
      return score >= 3 ? "hi" : "en";
    }

    function detectReplyStyle(text, lang) {
      if (lang !== "hi") return lang;
      if (/[\u0900-\u097F]/.test(text)) return "hi-dev";
      return "hi-roman";
    }

    function cleanupTopic(text) {
      return normalize(text)
        .replace(/\b(please|plz|script|hook|seo|analysis|caption|full pack|full package)\b/gi, " ")
        .replace(/\b(bnao|banao|do|de|likho|generate)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function fallbackData(topic, mode, replyStyle) {
      const safeTopic = topic || "idea";

      if (replyStyle === "hi-dev") {
        return {
          titles: [
            `${safeTopic} की अनकही कहानी`,
            `${safeTopic} का संघर्ष`,
            `${safeTopic} का सच`
          ],
          hook: `एक ऐसी शुरुआत जो viewers को पहले ही पल रोक सकती है।`,
          script: [
            `शुरुआत में एक strong emotional ya curiosity moment आता है।`,
            `बीच में संघर्ष, भावना और impact कहानी को मजबूत बनाते हैं।`,
            `अंत में एक ऐसा मोड़ आता है जो content को यादगार बना सकता है।`
          ],
          seo: {
            keywords: [`${safeTopic}`, `${safeTopic} story`, `${mode} content`],
            hashtags: ["#viral", "#story", "#content"],
            caption: `${safeTopic} पर based एक ऐसा idea jo सही presentation ke saath strong perform kar sakta hai.`
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

      if (replyStyle === "hi-roman") {
        return {
          titles: [
            `${safeTopic} ki ankahi kahani`,
            `${safeTopic} ka sangharsh`,
            `${safeTopic} ka sach`
          ],
          hook: `Ek aisi shuruaat jo viewer ko pehle hi pal rok sakti hai.`,
          script: [
            `Shuruaat me ek strong emotional ya curiosity moment aata hai.`,
            `Beech me struggle, emotion aur impact content ko aur strong banate hain.`,
            `End me ek aisa mod aata hai jo story ko yaadgar bana sakta hai.`
          ],
          seo: {
            keywords: [`${safeTopic}`, `${safeTopic} story`, `${mode} content`],
            hashtags: ["#viral", "#story", "#content"],
            caption: `${safeTopic} par based ek aisa idea jo sahi presentation ke saath strong perform kar sakta hai.`
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

      if (replyStyle === "ar") {
        return {
          titles: [
            `قصة ${safeTopic}`,
            `صراع ${safeTopic}`,
            `الحقيقة وراء ${safeTopic}`
          ],
          hook: `بداية قوية يمكنها أن توقف المشاهد من اللحظة الأولى.`,
          script: [
            `تبدأ الفكرة بلحظة قوية أو مثيرة للفضول.`,
            `في المنتصف يظهر الصراع أو التأثير العاطفي بوضوح.`,
            `في النهاية يوجد تحول يجعل المحتوى أكثر تذكرًا.`
          ],
          seo: {
            keywords: [safeTopic, `${safeTopic} story`, `${mode} content`],
            hashtags: ["#viral", "#story", "#content"],
            caption: `فكرة عن ${safeTopic} يمكن أن تؤدي بشكل أفضل مع عرض قوي.`
          },
          analysis: {
            score: "76%",
            strength: "الفكرة جذابة وقريبة من الجمهور.",
            weakness: "الخطاف يحتاج تحديدًا أكثر.",
            missing: "افتتاحية أقوى بصريًا.",
            improve: "ابدأ بلقطة صادمة أو عنصر فضول أقوى."
          }
        };
      }

      return {
        titles: [
          `The untold side of ${safeTopic}`,
          `The struggle behind ${safeTopic}`,
          `The real story of ${safeTopic}`
        ],
        hook: `A strong opening that can stop viewers in the very first moment.`,
        script: [
          `The opening starts with a strong emotional or curiosity-driven beat.`,
          `The middle builds conflict, feeling, and audience connection.`,
          `The ending lands with a turn that makes the content more memorable.`
        ],
        seo: {
          keywords: [safeTopic, `${safeTopic} story`, `${mode} content`],
          hashtags: ["#viral", "#story", "#content"],
          caption: `A ${safeTopic}-based idea that can perform better with stronger presentation.`
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

    function buildModeInstruction(mode) {
      const map = {
        video: "Create short-form creator content output.",
        story: "Create story-focused creator content output.",
        ad: "Create ad-focused persuasive content output.",
        serial: "Create serial/drama content output.",
        movie: "Create movie concept content output.",
        webseries: "Create web series concept output.",
        affiliate: "Create safe legal affiliate-style content and earning angle output.",
        freelance: "Create safe legal freelance offer/content output.",
        cricket: "Create cricket-focused content output.",
        stockmarket: "Create safe educational stock-market style content, no fake promises, no financial guarantee.",
        translator: "Translate and explain the user's intent clearly in the same structured output style.",
        pricecomparison: "Create safe comparison-style output, no fake live prices, no false claims, keep it practical.",
        aibrain: "Act as a multi-purpose AI brain and solve the user's request in a structured creator-friendly way."
      };
      return map[mode] || map.video;
    }

    function buildLanguageInstruction(replyStyle) {
      if (replyStyle === "hi-dev") {
        return "Reply in Hindi or natural Hindi mixed style using Devanagari script.";
      }
      if (replyStyle === "hi-roman") {
        return "Reply only in natural Roman Hindi / Hinglish. Do not switch to full English.";
      }
      if (replyStyle === "ar") {
        return "Reply only in Arabic.";
      }
      return "Reply only in English.";
    }

    function buildPrompt(userIdea, mode, userNeed, replyStyle, topic) {
      return `
${buildLanguageInstruction(replyStyle)}

You are Sazio AI.
${buildModeInstruction(mode)}

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No code fences
- No extra intro
- No explanation outside JSON
- No fake promises
- No generic filler
- Keep output short, clean, useful, and structured
- titles must be exactly 3
- script must be exactly 3 lines
- keywords must be exactly 3
- hashtags must be exactly 3
- analysis must stay honest
- for stock market, price comparison, affiliate, freelance and earning-related topics: keep everything legal, safe, grounded, and non-misleading

User idea: ${userIdea}
Main topic: ${topic}
Mode: ${mode}
User wants: ${userNeed || "title, hook, script, seo, analysis"}

Return EXACT JSON in this schema:
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
    const replyStyle = detectReplyStyle(safeIdea, lang);
    const topic = cleanupTopic(safeIdea) || "idea";
    const fallback = fallbackData(topic, safeType, replyStyle);
    const prompt = buildPrompt(safeIdea, safeType, safeOutput, replyStyle, topic);

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
            maxOutputTokens: 900,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      return res.status(200).json({
        result: formatOutput(fallback)
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        result: formatOutput(fallback)
      });
    }

    let rawText = "";
    try {
      rawText = (data?.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || "")
        .join("\n")
        .trim();
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
      titles: ensureArray(parsed.titles, 3, fallback.titles),
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
