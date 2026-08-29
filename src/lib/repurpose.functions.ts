import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  sourceText: z.string().min(20),
  targetGrade: z.string().min(1),
  targetLanguage: z.string().min(1),
});

export type RepurposeBlock =
  | { kind: "paragraph"; text: string; highlights?: string[] }
  | { kind: "formula"; text: string }
  | {
      kind: "gap";
      concept: string;
      why: string;
      bridgeTitle: string;
      bridgeLesson: string;
      minutes: number;
    };

export type RepurposeResult = {
  title: string;
  sourceGrade: string;
  blocks: RepurposeBlock[];
  wordCount: number;
  elapsedMs: number;
};

const SYSTEM = `You are Repurpose, a curriculum-bridging engine for refugee and migrant students.

You receive a raw excerpt from a textbook or worksheet. You must:
1. Rewrite it at the requested target grade / reading level: shorter sentences, plain vocabulary, concrete examples. Keep all the actual subject content — do not delete the problems or the physics/maths.
2. Translate the rewritten text fully into the requested target language. If the target language is English, keep it in English.
3. Detect "curriculum gap" concepts: ideas the source material assumes the student already knows, which are commonly NOT taught (or taught much later) in other national curricula. For each gap write a short standalone bridge lesson (60-110 words) that teaches just that prerequisite, written in the target language at the target grade level.

Return ONLY JSON matching this shape:
{
  "title": string,                       // rewritten section title, in the target language
  "sourceGrade": string,                 // your estimate of the source reading level, e.g. "Grade 10"
  "blocks": [
    { "kind": "paragraph", "text": string, "highlights": string[] },  // highlights = exact substrings of text that were simplified key terms
    { "kind": "formula", "text": string },                             // equations, kept in symbols
    { "kind": "gap", "concept": string, "why": string, "bridgeTitle": string, "bridgeLesson": string, "minutes": number }
  ]
}

Rules:
- 5 to 9 blocks total. Place each gap block immediately after the paragraph that triggers it.
- 2 to 4 gap blocks.
- "concept" is the prerequisite name (in English, for the teacher). "why" is one English sentence to the teacher explaining the assumption. "bridgeTitle" and "bridgeLesson" are in the target language, for the student.
- "minutes" is an integer 2-6.
- Every "highlights" entry must appear verbatim inside its paragraph "text". Use 0-2 per paragraph.
- No markdown, no code fences. JSON only.`;

export const repurpose = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<RepurposeResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this project.");

    const started = Date.now();
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Target grade / reading level: ${data.targetGrade}
Target language: ${data.targetLanguage}

SOURCE EXCERPT:
"""
${data.sourceText.slice(0, 12000)}
"""`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429)
        throw new Error("Too many requests right now — wait a few seconds and try again.");
      if (res.status === 402)
        throw new Error("AI credits are exhausted. Add credits in Lovable to keep generating.");
      throw new Error(`AI request failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: { title?: string; sourceGrade?: string; blocks?: RepurposeBlock[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("The AI returned an unreadable response. Try regenerating.");
    }

    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
    if (blocks.length === 0) throw new Error("No content was produced. Try regenerating.");

    return {
      title: parsed.title ?? "Rewritten excerpt",
      sourceGrade: parsed.sourceGrade ?? "Unknown",
      blocks,
      wordCount: data.sourceText.trim().split(/\s+/).length,
      elapsedMs: Date.now() - started,
    };
  });
