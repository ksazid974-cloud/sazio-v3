export default function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).json({
        success: false,
        error: "Only POST allowed"
      });
    }

    const { topic, mode } = req.body || {};

    if (!topic) {
      return res.status(200).json({
        success: false,
        error: "No topic"
      });
    }

    let result = "";

    if (mode === "video") {
      result = "Video content for: " + topic;
    } else if (mode === "seo") {
      result = "SEO content for: " + topic;
    } else {
      result = "Story for: " + topic;
    }

    return res.status(200).json({
      success: true,
      result: result
    });

  } catch (e) {
    return res.status(200).json({
      success: false,
      error: "Server crashed"
    });
  }
}
