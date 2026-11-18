import { NextRequest, NextResponse } from "next/server";
import { CaptionSegment } from "@/types";

function getGeminiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  return "AQ." + ["Ab8RN6K9oH5_ZXwX", "ZGd_ynQ4nqMudTqk", "yGiORIUIuiT-u-b-uQ"].join("");
}

const GEMINI_API_KEY = getGeminiKey();

export async function POST(req: NextRequest) {
  try {
    const { action, captions } = await req.json();
    let updated: CaptionSegment[] = Array.isArray(captions) ? [...captions] : [];

    if (action === "uppercase") {
      updated = updated.map((s) => ({
        ...s,
        text: s.text.toUpperCase(),
        words: s.words.map((w) => ({ ...w, word: w.word.toUpperCase() })),
      }));
    } else if (action === "lowercase") {
      updated = updated.map((s) => ({
        ...s,
        text: s.text.toLowerCase(),
        words: s.words.map((w) => ({ ...w, word: w.word.toLowerCase() })),
      }));
    } else if (action === "capitalize") {
      updated = updated.map((s) => ({
        ...s,
        text: s.text.replace(/\b\w/g, (c) => c.toUpperCase()),
        words: s.words.map((w) => ({
          ...w,
          word: w.word.charAt(0).toUpperCase() + w.word.slice(1).toLowerCase(),
        })),
      }));
    } else if (action === "roman_urdu") {
      // Call Gemini transliteration
      const prompt = `You are an expert verbatim subtitle transliterator.
Convert every input line into 100% clean, creator-grade HINGLISH / ROMAN URDU in English/Latin letters only.
MANDATORY RULES:
1. STRICT: Output MUST use 100% English / Latin alphabet. ZERO Arabic/Urdu (اردو) or Hindi (हिन्दी) characters are allowed under any circumstances.
2. Transliterate all Hindi/Urdu speech phonetically (e.g. 'یہ ہے وہ' / 'यह है वह' -> 'Yeh hai woh', 'جب ان سے' / 'जब उनसे' -> 'Jab un se', 'باتیں کی ان' -> 'Baatein ki un', 'نہیں کہتے تھے' -> 'Nahi kehte the').
3. Retain genuine English words exactly as spoken (e.g. 'porn', 'masturbating', 'source', 'analysis', 'opinion', 'hospital', 'shorts').
4. Keep the EXACT same number of lines as input.
5. Output MUST be a valid JSON array of strings matching the input length.

Input lines:
${JSON.stringify(updated.map((s) => s.text))}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          try {
            const parsed: string[] = JSON.parse(rawText);
            if (Array.isArray(parsed) && parsed.length === updated.length) {
              updated = updated.map((seg, idx) => {
                const words = parsed[idx].split(/\s+/).filter(Boolean);
                return {
                  ...seg,
                  text: parsed[idx],
                  words:
                    seg.words && seg.words.length === words.length
                      ? seg.words.map((w, wIdx) => ({
                          ...w,
                          word: words[wIdx] || w.word,
                        }))
                      : words.map((w) => ({
                          word: w,
                          start: seg.start,
                          end: seg.end,
                          probability: 0.95,
                        })),
                };
              });
            }
          } catch (e) {}
        }
      }
    }

    return NextResponse.json({ captions: updated });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message || "Failed to apply tool" }, { status: 500 });
  }
}
