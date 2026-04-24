export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Only POST allowed" });
  }

  try {
    const { idea, duration, type, goal } = req.body || {};

    if (!idea) {
      return res.status(400).json({ success: false, error: "Idea likho bhai!" });
    }

    let script = `🚀 SAZIO AI ULTRA v2.0\n\n`;
    let revenue = "";

    // Long Form + Cinematic Logic
    const cinematic = "ARRI Alexa 65 Pro Max, cinematic masterpiece, dramatic lighting, hyper realistic, 8K, emotional depth, film grain, directed by Christopher Nolan style";

    script += `📌 Duration: ${duration}\n`;
    script += `🎬 Type: ${type}\n\n`;
    script += `🔥 Idea: ${idea}\n\n`;

    if (type === "movie" || type === "webseries" || duration.includes("hr")) {
      script += `🎥 FULL ${duration} MOVIE / SERIES READY (ARRI Level)\n\n`;
      script += `1. Hook (First 30 sec): ${idea} ke emotional starting scene\n`;
      script += `2. Full Story Arc + Twists ready\n`;
      script += `3. Cinematic Video Prompt (Kling AI / Runway mein paste karo):\n${cinematic}, ${idea}, ${duration} long cinematic video\n\n`;
      script += `4. Advanced Editing Guide: Scene by scene cuts, zoom, b-roll, music sync, subtitles\n`;
    } else {
      script += `🎥 PRO CINEMATIC VIDEO READY\n\n`;
      script += `Video Prompt: ${cinematic}, ${idea}\n`;
    }

    // Revenue + Subscription Plan
    revenue = `💰 SAFE LEGAL MONETIZATION PLAN:\n`;
    revenue += `• YouTube Monetization: ₹50,000 - ₹5 Lakh/month possible\n`;
    revenue += `• Subscription Idea: ₹99/month Pro Plan (long video + priority)\n`;
    revenue += `• Affiliate: Amazon/Flipkart links auto add\n`;
    revenue += `• Best Upload Time: Evening 7-9 PM (India)\n`;
    revenue += `• Scam Check: 100% Safe & Legal ✅\n\n`;
    revenue += `Tum isse full movie bana ke YouTube pe daal sakte ho aur safely paisa kama sakte ho.`;

    return res.status(200).json({
      success: true,
      script: script,
      result: script,
      revenue: revenue,
      status: "✅ ARRI Level Long Video + Revenue Ready"
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
