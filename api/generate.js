export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ result: "Method not allowed" });
  }

  try {
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    } catch {
      body = {};
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ result: "API KEY NOT FOUND" });
    }

    const { idea, type, output } = body;
    const safeIdea = typeof idea === "string" ? idea.trim() : "";
    const safeType = typeof type === "string" && type.trim() ? type.trim() : "video";
    const safeOutput =
      typeof output === "string" && output.trim()
        ? output.trim()
        : "script, hook, SEO, analysis, translation, compare, earning idea";

    if (!safeIdea) {
      return res.status(200).json({ result: "Idea required" });
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

    function removeLeadingEk(topic, lang) {
      let t = normalize(topic);
      if (lang === "hi-dev" || lang === "hi-roman") {
        t = t.replace(/^ek\s+/i, "").trim();
      }
      return t || "idea";
    }

    function buildLanguageInstruction(lang) {
      if (lang === "hi-dev") {
        return "Reply mainly in Hindi using Devanagari script. Avoid unnecessary English words where possible.";
      }
      if (lang === "hi-roman") {
        return "Reply only in natural Roman Hindi / Hinglish. Avoid full English response.";
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

You are Sazio AI Pro.

${buildModeInstruction(mode)}

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No code fences
- No intro
- No explanation outside JSON
- No fake promises
- titles must be exactly 3
- script must be exactly 3 complete lines
- seo.keywords must be exactly 3
- seo.hashtags must be exactly 3
- analysis must stay honest
- Titles must NOT repeat the full raw user input
- Use the cleaned topic naturally
- Make the script feel like an actual progressing story, not generic placeholders
- For earning, comparison, affiliate, freelance, and stock topics keep output legal, safe, grounded, and non-misleading
- After Analysis, also add:
  - translation (2 short lines)
  - compare (3 short lines)
  - earning (3 short legal-safe lines)
  - brain (3 short lines)

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
  },
  "translation": {
    "line1": "...",
    "line2": "..."
  },
  "compare": ["...", "...", "..."],
  "earning": ["...", "...", "..."],
  "brain": ["...", "...", "..."]
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
            `${t} की कहानी सुबह के एक ऐसे दृश्य से शुरू होती है जहाँ मुश्किल साफ दिखाई देती है।`,
            `बीच में हालत और खराब होती है, लोग साथ नहीं देते, लेकिन मुख्य किरदार हार नहीं मानता।`,
            `अंत में उसका एक फैसला कहानी को बदल देता है और वही संघर्ष उसकी ताकत बन जाता है।`
          ],
          seo: {
            keywords: [t, `${t} कहानी`, `${mode} content`],
            hashtags: ["#viral", "#story", "#content"],
            caption: `${t} पर based एक ऐसा idea जो सही presentation के साथ strong perform kar sakta hai।`
          },
          analysis: {
            score: "78%",
            strength: "Emotion aur relatability strong hai.",
            weakness: "Twist aur sharper ho sakta hai.",
            missing: "Opening shock aur stronger ho sakta hai.",
            improve: "Pehle 2 second me visual danger ya strong contrast jodo."
          },
          translation: {
            line1: `${t} की कहानी का साफ version`,
            line2: `A simple translation-ready line about ${t}`
          },
          compare: [
            `${t} idea emotional content ke liye strong hai.`,
            `${t} idea story mode me ad mode se better perform kar sakta hai.`,
            `${t} idea me stronger twist add karke aur improve kiya ja sakta hai.`
          ],
          earning: [
            `${t} idea ko YouTube Shorts ke liye use kiya ja sakta hai.`,
            `${t} idea par reel, script ya freelance content service ban sakti hai.`,
            `${t} idea ko legal safe creator package me convert kiya ja sakta hai.`
          ],
          brain: [
            `${t} ko movie angle me expand kiya ja sakta hai.`,
            `${t} ko web series episode breakdown me convert kiya ja sakta hai.`,
            `${t} ko ad, story, ya social content format me adapt kiya ja sakta hai.`
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
            `${t} ki kahani subah ke ek aise scene se shuru hoti hai jahan mushkil saaf dikh rahi hoti hai.`,
            `Beech me halat aur kharab hote hain, log saath nahi dete, lekin main character haar nahi maanta.`,
            `End me uska ek faisla sab badal deta hai aur wahi struggle uski sabse badi taqat ban jata hai.`
          ],
          seo: {
            keywords: [t, `${t} story`, `${mode} content`],
            hashtags: ["#viral", "#story", "#content"],
            caption: `${t} par based ek aisa idea jo sahi presentation ke saath strong perform kar sakta hai.`
          },
          analysis: {
            score: "78%",
            strength: "Emotion aur relatability strong hai.",
            weakness: "Twist aur sharper ho sakta hai.",
            missing: "Opening shock aur stronger ho sakta hai.",
            improve: "Pehle 2 second me visual danger ya strong contrast jodo."
          },
          translation: {
            line1: `${t} ki story ka simple version`,
            line2: `A simple translation-ready line about ${t}`
          },
          compare: [
            `${t} idea emotional content ke liye strong hai.`,
            `${t} idea story mode me ad mode se better perform kar sakta hai.`,
            `${t} idea me stronger twist add karke aur improve kiya ja sakta hai.`
          ],
          earning: [
            `${t} idea ko YouTube Shorts ke liye use kiya ja sakta hai.`,
            `${t} idea par reel, script ya freelance content service ban sakti hai.`,
            `${t} idea ko legal safe creator package me convert kiya ja sakta hai.`
          ],
          brain: [
            `${t} ko movie angle me expand kiya ja sakta hai.`,
            `${t} ko web series episode breakdown me convert kiya ja sakta hai.`,
            `${t} ko ad, story, ya social content format me adapt kiya ja sakta hai.`
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
            `في المنتصف يزداد الضغط والصراع ولا يحصل البطل على الدعم بسهولة.`,
            `في النهاية يؤدي قرار واحد إلى تغيير كبير يجعل القصة أكثر تأثيرًا.`
          ],
          seo: {
            keywords: [t, `${t} story`, `${mode} content`],
            hashtags: ["#viral", "#story", "#content"],
            caption: `فكرة عن ${t} يمكن أن تؤدي بشكل أفضل مع عرض قوي.`
          },
          analysis: {
            score: "78%",
            strength: "الفكرة عاطفية وقريبة من الجمهور.",
            weakness: "يمكن أن يكون التحول أقوى.",
            missing: "افتتاحية أكثر صدمة.",
            improve: "ابدأ بلقطة أقوى أو عنصر فضول أكبر."
          },
          translation: {
            line1: `نسخة مبسطة من فكرة ${t}`,
            line2: `A simple translation-ready line about ${t}`
          },
          compare: [
            `فكرة ${t} مناسبة للمحتوى العاطفي.`,
            `وضع القصة قد يكون أفضل من وضع الإعلان لهذه الفكرة.`,
            `يمكن تحسين الفكرة بإضافة تحول أقوى.`
          ],
          earning: [
            `يمكن استخدام فكرة ${t} في محتوى قصير قانوني وآمن.`,
            `يمكن تحويل الفكرة إلى خدمة كتابة أو محتوى مستقل.`,
            `يمكن تقديمها ضمن باقة منشئ محتوى آمنة وقانونية.`
          ],
          brain: [
            `يمكن توسيع ${t} إلى فكرة فيلم.`,
            `يمكن تقسيم ${t} إلى حلقات لسلسلة ويب.`,
            `يمكن تكييف ${t} للإعلانات أو المحتوى الاجتماعي.`
          ]
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
          `The middle builds pressure, emotional conflict, and rising stakes around the main character.`,
          `The ending turns on one decision that changes the direction of the story and leaves impact.`
        ],
        seo: {
          keywords: [t, `${t} story`, `${mode} content`],
          hashtags: ["#viral", "#story", "#content"],
          caption: `A ${t}-based idea that can perform better with stronger presentation.`
        },
        analysis: {
          score: "78%",
          strength: "The idea is emotional and relatable.",
          weakness: "The twist can be sharper.",
          missing: "A stronger opening visual is missing.",
          improve: "Add more shock, contrast, or curiosity in the first 2 seconds."
        },
        translation: {
          line1: `A simple version of the ${t} idea`,
          line2: `A translation-ready line about ${t}`
        },
        compare: [
          `${t} works better for emotional content than flat informational content.`,
          `${t} may perform better in story mode than ad mode.`,
          `${t} can improve more with a stronger twist.`
        ],
        earning: [
          `${t} can be used for YouTube Shorts style content.`,
          `${t} can be packaged into script or freelance creator services.`,
          `${t} can be turned into a legal safe content offer.`
        ],
        brain: [
          `${t} can be expanded into a movie angle.`,
          `${t} can be broken into web series episodes.`,
          `${t} can be adapted for ad, story, or social content.`
        ]
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
          } catch {
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

        t = t
          .replace(/\bki ki\b/gi, "ki")
          .replace(/\bka ka\b/gi, "ka")
          .replace(/\bke ke\b/gi, "ke")
          .replace(/\s+/g, " ")
          .trim();

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
Improve: ${data.analysis.improve}

Translation:
- ${data.translation.line1}
- ${data.translation.line2}

Compare:
- ${data.compare[0]}
- ${data.compare[1]}
- ${data.compare[2]}

Earning:
- ${data.earning[0]}
- ${data.earning[1]}
- ${data.earning[2]}

AI Brain:
- ${data.brain[0]}
- ${data.brain[1]}
- ${data.brain[2]}`;
    }

    const lang = detectLanguage(safeIdea);
    const topic = removeLeadingEk(cleanupTopic(safeIdea), lang);
    const fallback = fallbackData(topic, safeType, lang);
    const prompt = buildPrompt(safeIdea, safeType, safeOutput, lang, topic);

    let data = null;
    try {
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
              maxOutputTokens: 1400
            }
          })
        }
      );

      data = await response.json();

      if (!response.ok) {
        return res.status(200).json({
          result: formatOutput(fallback)
        });
      }
    } catch {
      return res.status(200).json({
        result: formatOutput(fallback)
      });
    }

    let rawText = "";
    try {
      const parts = data?.candidates?.[0]?.content?.parts || [];
      rawText = parts.map((part) => part.text || "").join("\n").trim();
    } catch {
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
      },
      translation: {
        line1: ensureString(parsed?.translation?.line1, fallback.translation.line1),
        line2: ensureString(parsed?.translation?.line2, fallback.translation.line2)
      },
      compare: ensureArray(parsed?.compare, 3, fallback.compare),
      earning: ensureArray(parsed?.earning, 3, fallback.earning),
      brain: ensureArray(parsed?.brain, 3, fallback.brain)
    };

    return res.status(200).json({
      result: formatOutput(finalData)
    });
  } catch (error) {
    return res.status(200).json({
      result: "SERVER ERROR: " + error.message
    });
  }
}
