export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { topic, mode } = req.body || {};

    const t = String(topic || "").trim();
    const m = String(mode || "all").toLowerCase().trim();

    if (!t) {
      return res.status(400).json({
        success: false,
        error: "No topic provided"
      });
    }

    // RANDOM ENGINE
    const seed = Math.floor(Math.random() * 100000);
    const v = seed % 4;

    function titleCase(text) {
      return text
        .split(" ")
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    const heroTypes = [
      "Ek aisa insaan jise duniya ignore karti hai",
      "Ek kamzor dikhne wala character jisme andar se fire hai",
      "Ek simple hero jise koi seriously nahi leta",
      "Ek aisa banda jo haar ke baad bhi rukta nahi"
    ];

    function story() {
      return `TITLE:
${titleCase(t)} | Viral Emotional Story

HOOK:
Sirf 2 second me sab kuch badalne wala hai...

STORY:
${heroTypes[v]} ${t} ki situation me phas jata hai. Sab log dekhte rehte hain, koi help nahi karta. Problem badhti hai, emotions peak par pahunchte hain. Character tootne lagta hai... fir ek powerful comeback aata hai. Last me sabko shock milta hai.

SCENES (1-9):
1. Danger entry
2. Shock face close-up
3. Crowd reaction
4. Struggle start
5. Emotional breakdown
6. Idea / comeback
7. Twist
8. Victory
9. Loop ending`;
    }

    function seo() {
      return `SEO TITLE:
${titleCase(t)} | Must Watch Viral Story

DESCRIPTION:
${titleCase(t)} ki ye kahani shock + emotion + twist ka perfect combo hai.

TAGS:
${t}, viral, reels, shorts, trending, emotional

THUMBNAIL:
SHOCKING 😱`;
    }

    function money() {
      return `EARNING PLAN:
${titleCase(t)} ko short content me convert karo.

PLATFORMS:
YouTube Shorts, Instagram, Fiverr

STRATEGY:
- Daily 3 videos
- Strong hook
- Twist ending

INCOME:
- Freelance
- Affiliate
- Ads`;
    }

    function caption() {
      return `CAPTION:
${titleCase(t)} but make it viral 🔥

HOOK:
End tak dekhna...

HASHTAGS:
#viral #shorts #reels #${t.replace(/\s+/g, "")}`;
    }

    function video() {
      return `VIDEO PLAN:
1. Danger hook
2. Emotional close-up
3. Crowd reaction
4. Struggle
5. Crying
6. Comeback
7. Twist
8. Victory
9. Loop

STYLE:
Ultra realistic cinematic`;
    }

    let result = "";

    if (m === "story") result = story();
    else if (m === "seo") result = seo();
    else if (m === "money") result = money();
    else if (m === "caption") result = caption();
    else if (m === "video") result = video();
    else {
      result = `${story()}

-------------------------

${seo()}

-------------------------

${caption()}

-------------------------

${video()}

-------------------------

${money()}`;
    }

    return res.status(200).json({
      success: true,
      result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Server error"
    });
  }
}
