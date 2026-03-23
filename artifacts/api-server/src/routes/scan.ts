import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

router.post("/photo", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ error: "No image provided" });
      return;
    }

    const base64 = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: base64, detail: "high" },
            },
            {
              type: "text",
              text: `You are an IMEI and device model extraction assistant. Look at this image of a device or device box and extract the IMEI number and device model.

Respond ONLY in this exact JSON format:
{
  "imageQuality": "clear" | "blurry" | "no_imei",
  "imei": "15-digit number or null",
  "model": "device model name or null",
  "confidence": "high" | "medium" | "low",
  "warning": "short warning message if any issue, or null"
}

Rules:
- imageQuality "clear" = IMEI is readable
- imageQuality "blurry" = image is too blurry to read
- imageQuality "no_imei" = clear image but no IMEI visible
- imei must be exactly 15 digits, no spaces or dashes
- model should be brand + model (e.g. "Samsung Galaxy A54" or "iPhone 14 Pro")
- If image is blurry set warning to "Image is not clear. Please retake the photo in better lighting."
- If no IMEI visible set warning to "No IMEI found. Point camera at the label on the box or the back of the device."
- confidence reflects how certain you are of the extracted values`,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "{}";

    let parsed: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    res.json({
      imageQuality: parsed.imageQuality || "no_imei",
      imei: parsed.imei || null,
      model: parsed.model || null,
      confidence: parsed.confidence || "low",
      warning: parsed.warning || null,
    });
  } catch (err: any) {
    console.error("Scan photo error:", err);
    res.status(500).json({ error: "Failed to analyze image: " + (err.message || "Unknown error") });
  }
});

export default router;
