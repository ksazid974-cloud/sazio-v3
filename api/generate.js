export default async function handler(req, res) {
  // --- CORS (safe) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST allowed"
    });
  }

  try {
    // --- SAFE BODY PARSE ---
    let body = req.body;

    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const topic = (body?.topic || "").toString().trim();
    const mode = (body?.mode || "story").toString().toLowerCase().trim();

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: "Topic missing"
      });
    }

    const result = buildOutput(topic, mode);

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

// ---------------- ENGINE ----------------

function buildOutput(topic, mode) {
  const t = toTitle(topic);

  if (mode === "video") {
    return buildVideo(t);
  }

  if (mode === "seo") {
    return buildSEO(t);
  }

  if (mode === "earning") {
    return buildEarning(t);
  }

  return buildStory(t);
}

// ---------------- STORY ----------------

function buildStory(t) {
  return `TITLE:
${t} | Emotional Viral Story

HOOK:
Everything changes in seconds...

FULL STORY:
A struggling character faces a harsh situation related to ${t}. At first, nobody helps. People watch silently. The pressure increases. The character almost breaks. Then something shifts inside. With courage and determination, the character makes a powerful move and changes everything. The ending delivers strong emotion and satisfaction.

SCENES:
1. Sudden danger
2. Fear close-up
3. Crowd reaction
4. Struggle begins
5. Emotional breakdown
6. New idea
7. Twist
8. Victory
9. Loop ending

VIDEO PROMPT:
Ultra realistic cinematic scene about ${t}, strong emotions, dramatic lighting, viral storytelling.

SOUND:
Impact → silence → emotion → rise → victory`;
}

// ---------------- VIDEO ----------------

function buildVideo(t) {
  return `VIDEO SCRIPT:
Topic: ${t}

HOOK:
A sudden shocking moment in ${t}

STORY:
A simple character struggles in ${t}. Ignored at first, pressure builds. A twist changes everything, leading to a powerful comeback.

SCENES:
1. Danger
2. Emotion close-up
3. Public reaction
4. Struggle
5. Breakdown
6. Comeback
7. Twist
8. Victory
9. Loop

CAMERA:
Close-up, wide shot, low angle, loop frame

SOUND:
Impact, breathing, crowd, rise, victory`;
}

// ---------------- SEO ----------------

function buildSEO(t) {
  return `SEO TITLE:
${t} | Must Watch Emotional Story

DESCRIPTION:
This emotional story about ${t} includes a powerful hook, deep struggle, and shocking ending.

TAGS:
${t}, viral, reels, shorts, emotional, trending, story, cinematic

THUMBNAIL:
SHOCKING END

PINNED:
Did this story touch your heart? ❤️`;
}

// ---------------- EARNING ----------------

function buildEarning(t) {
  return `EARNING PLAN:
Use ${t} as content idea.

PLATFORMS:
YouTube Shorts, Instagram Reels, Facebook

STRATEGY:
- Post daily
- Strong hook
- Emotional + twist

MONETIZATION:
Ads, affiliate, freelance, brand deals`;
}

// ---------------- UTIL ----------------

function toTitle(text) {
  return text
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
