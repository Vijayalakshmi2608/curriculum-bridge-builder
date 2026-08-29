import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import { repurpose, type RepurposeBlock, type RepurposeResult } from "@/lib/repurpose.functions";
import { DEMO_EXCERPT, DEMO_SOURCE_NAME } from "@/lib/demo-excerpt";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Repurpose — Rewrite any lesson into their curriculum" },
      {
        name: "description",
        content:
          "Upload a textbook page. Repurpose rewrites it to the target grade, translates it, flags curriculum gaps and writes a bridge lesson for each one.",
      },
      { property: "og:title", content: "Repurpose — Rewrite any lesson into their curriculum" },
      {
        property: "og:description",
        content:
          "Upload a textbook page. Repurpose rewrites it to the target grade, translates it, flags curriculum gaps and writes a bridge lesson for each one.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RepurposePage,
});

const shortGrade = (g: string) => g.split(" · ")[0] ?? g;
const shortLang = (l: string) => l.split(" (")[0] ?? l;

const GRADES = [
  "Grade 5 · Reading level A2",
  "Grade 6 · Reading level A2+",
  "Grade 7 · Reading level B1",
  "Grade 8 · Reading level B2",
  "Grade 9 · Reading level B2+",
  "Grade 10 · Reading level C1",
];

const LANGUAGES = [
  "English",
  "Swahili (Kiswahili)",
  "Arabic (العربية)",
  "Ukrainian (українська)",
  "Dari (دری)",
  "Spanish (Español)",
  "French (Français)",
  "Somali (Soomaali)",
  "Pashto (پښتو)",
  "Tigrinya (ትግርኛ)",
];

type Stage = 0 | 1 | 2 | 3;

function Swatch({ className }: { className: string }) {
  return <div className={className} />;
}

function Field({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-paper/60">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border-2 border-ink bg-paper px-3 py-2.5 font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-mustard disabled:opacity-60"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-lg leading-none text-ink/40">
          ▾
        </span>
      </div>
    </div>
  );
}

function Highlighted({ text, highlights }: { text: string; highlights: string[] }) {
  const terms = highlights.filter((h) => h && text.includes(h));
  if (terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  );
  return (
    <>
      {text.split(pattern).map((part, i) =>
        terms.includes(part) ? (
          <span key={i} className="bg-mustard/40 px-1">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function GapCard({
  block,
  index,
}: {
  block: Extract<RepurposeBlock, { kind: "gap" }>;
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border-2 border-vermilion bg-vermilion/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="size-3 bg-vermilion" />
        <span className="font-grotesk text-xs font-bold tracking-[0.15em] text-vermilion uppercase">
          Curriculum gap · {block.concept}
        </span>
      </div>
      <p className="mb-3 text-sm text-ink/70">{block.why}</p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 border border-sage/30 bg-sage/10 px-3 py-2 text-left"
      >
        <span className="size-2 rounded-full bg-sage" />
        <span className="text-sm font-medium text-sage">
          Bridge lesson ready · {block.minutes} min
        </span>
        <span className="ml-auto text-lg leading-none text-ink/40">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="rp-rise mt-2 border-l-2 border-sage bg-panel px-4 py-3">
          <p className="font-grotesk mb-1.5 text-sm font-bold text-ink">{block.bridgeTitle}</p>
          <p className="text-[15px] leading-relaxed text-ink/80">{block.bridgeLesson}</p>
        </div>
      )}
    </div>
  );
}

function RepurposePage() {
  const run = useServerFn(repurpose);

  const [sourceText, setSourceText] = useState(DEMO_EXCERPT);
  const [sourceName, setSourceName] = useState(DEMO_SOURCE_NAME);
  const [grade, setGrade] = useState<string>(GRADES[3]!);
  const [language, setLanguage] = useState<string>(LANGUAGES[1]!);
  const [pasting, setPasting] = useState(false);
  const [stage, setStage] = useState<Stage>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RepurposeResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const words = sourceText.trim().split(/\s+/).filter(Boolean).length;
  const gaps = result ? result.blocks.filter((b) => b.kind === "gap").length : 0;

  const onFile = useCallback(async (file: File) => {
    setError(null);
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        setBusy(true);
        setStage(1);
        const { extractPdfText } = await import("@/lib/extract-pdf");
        const text = await extractPdfText(file);
        if (!text.trim()) throw new Error("No selectable text found in that PDF.");
        setSourceText(text);
      } else {
        setSourceText(await file.text());
      }
      setSourceName(file.name);
      setResult(null);
      setStage(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
      setStage(0);
    } finally {
      setBusy(false);
    }
  }, []);

  const generate = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setStage(1);
    const tick1 = setTimeout(() => setStage(2), 700);
    try {
      const out = await run({
        data: { sourceText, targetGrade: grade, targetLanguage: language },
      });
      setStage(3);
      setResult(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
      setStage(0);
    } finally {
      clearTimeout(tick1);
      setBusy(false);
    }
  }, [busy, run, sourceText, grade, language]);

  return (
    <div className="bg-paper font-body text-ink min-h-screen antialiased">
      <div className="h-3 w-full">
        <div className="flex h-full">
          <Swatch className="bg-vermilion w-1/3" />
          <Swatch className="bg-cobalt w-1/3" />
          <Swatch className="bg-mustard w-1/3" />
        </div>
      </div>

      <header className="border-ink border-b-2">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-8 grid-cols-2 grid-rows-2 gap-0.5">
              <Swatch className="bg-vermilion" />
              <Swatch className="bg-cobalt" />
              <Swatch className="bg-mustard" />
              <Swatch className="bg-ink" />
            </div>
            <div>
              <p className="font-grotesk text-2xl leading-none font-extrabold tracking-tight">
                Repurpose
              </p>
              <p className="mt-1 text-[11px] tracking-[0.2em] text-ink/50 uppercase">
                Curriculum Rewriter
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink/70 md:flex">
            <span>Extract</span>
            <span>Rewrite</span>
            <span>Bridge</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-12">
        {/* hero */}
        <section className="mb-12 grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="bg-cobalt text-paper mb-6 inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase">
              <span className="bg-mustard size-2 rounded-full" />
              Live demo · {sourceName.length > 34 ? sourceName.slice(0, 34) + "…" : sourceName}
            </div>
            <h1 className="font-grotesk text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[0.92] font-extrabold tracking-tight">
              Teach the same lesson,
              <br />
              <span className="text-vermilion">in their curriculum.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
              Drop in a textbook page. Repurpose rewrites it to the target grade, translates it into
              the student's language, and flags every concept the new material assumes they already
              know — then builds a bridge lesson for each gap.
            </p>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-ink text-paper p-5">
              <p className="text-paper/50 mb-4 text-[11px] tracking-[0.2em] uppercase">This run</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-paper/60 text-sm">Source grade</span>
                  <span className="font-grotesk text-2xl font-bold">
                    {result ? result.sourceGrade : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-paper/60 text-sm">Target grade</span>
                  <span className="font-grotesk text-mustard text-2xl font-bold">
                    {shortGrade(grade)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-paper/60 text-sm">Language</span>
                  <span className="font-grotesk text-vermilion text-right text-xl font-bold">
                    {shortLang(language)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* upload + settings */}
        <section className="mb-10">
          <div className="grid gap-4 lg:grid-cols-12">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) void onFile(f);
              }}
              className="bg-panel border-ink grid border-2 p-10 lg:col-span-7"
            >
              {pasting ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    autoFocus
                    value={sourceText}
                    onChange={(e) => {
                      setSourceText(e.target.value);
                      setSourceName("pasted-text.txt");
                    }}
                    rows={9}
                    className="border-ink bg-paper w-full resize-none border-2 p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-mustard"
                    placeholder="Paste the textbook or worksheet text here…"
                  />
                  <button
                    onClick={() => setPasting(false)}
                    className="font-grotesk bg-ink text-paper self-start px-4 py-2 text-sm font-semibold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="place-self-center text-center">
                  <div className="mx-auto mb-4 grid size-12 grid-cols-3 grid-rows-2 gap-1">
                    <Swatch className="bg-vermilion" />
                    <Swatch className="bg-mustard" />
                    <Swatch className="bg-ink" />
                    <Swatch className="bg-ink" />
                    <Swatch className="bg-cobalt" />
                    <Swatch className="bg-vermilion" />
                  </div>
                  <p className="font-grotesk text-xl font-bold">{sourceName}</p>
                  <p className="mt-1 text-sm text-ink/60">
                    {words.toLocaleString()} words extracted · ready to repurpose
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="border-ink font-grotesk border-2 px-4 py-2 text-sm font-semibold"
                    >
                      Upload PDF
                    </button>
                    <button
                      onClick={() => setPasting(true)}
                      className="border-ink/30 font-grotesk border-2 px-4 py-2 text-sm font-semibold text-ink/70"
                    >
                      Paste text
                    </button>
                  </div>
                  <p className="mt-4 text-[13px] text-ink/40">Or drop a PDF anywhere in this box</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="bg-cobalt text-paper border-ink border-2 p-5 lg:col-span-5">
              <p className="text-paper/50 mb-4 text-[11px] tracking-[0.2em] uppercase">
                Rewrite settings
              </p>
              <div className="space-y-4">
                <Field
                  label="Target grade level"
                  value={grade}
                  options={GRADES}
                  onChange={(v) => setGrade(v)}
                  disabled={busy}
                />
                <Field
                  label="Target language"
                  value={language}
                  options={LANGUAGES}
                  onChange={(v) => setLanguage(v)}
                  disabled={busy}
                />
                <button
                  onClick={() => void generate()}
                  disabled={busy}
                  className="bg-mustard text-ink border-ink font-grotesk w-full border-2 py-3 text-base font-bold transition hover:brightness-105 disabled:opacity-70"
                >
                  {busy ? "Working…" : result ? "Regenerate" : "Repurpose this page"}
                </button>
                {error && (
                  <p className="bg-vermilion text-paper px-3 py-2 text-sm font-medium">{error}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* pipeline */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-grotesk text-lg font-bold tracking-tight">Pipeline</h2>
            <span className="text-[13px] font-medium text-ink/60">
              {result ? (
                <>
                  Completed in{" "}
                  <span className="text-vermilion font-bold">
                    {(result.elapsedMs / 1000).toFixed(1)}s
                  </span>
                </>
              ) : busy ? (
                "Running…"
              ) : (
                "Idle"
              )}
            </span>
          </div>
          <div className="border-ink bg-panel border-2">
            <div className="divide-ink grid grid-cols-1 divide-y-2 sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
              {[
                {
                  n: 1,
                  title: "Extract",
                  sub: `${words.toLocaleString()} words`,
                  active: stage >= 1,
                },
                {
                  n: 2,
                  title: "Rewrite & translate",
                  sub: `${shortGrade(grade)} · ${shortLang(language)}`,
                  active: stage >= 2,
                },
                {
                  n: 3,
                  title: "Gap detection",
                  sub: result ? `${gaps} gaps · ${gaps} bridge lessons` : "waiting",
                  active: stage >= 3,
                },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-3 p-4">
                  <span
                    className={`font-grotesk grid size-7 place-items-center text-sm font-bold ${
                      s.active && s.n === 3
                        ? "bg-vermilion text-paper"
                        : s.active
                          ? "bg-ink text-paper"
                          : "border-ink/30 border-2 text-ink/40"
                    } ${busy && s.active ? "animate-pulse" : ""}`}
                  >
                    {s.n}
                  </span>
                  <div>
                    <p className="font-grotesk text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-ink/50">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-ink h-2 w-full">
              <div
                className="h-full transition-[width] duration-500"
                style={{
                  width: `${(stage / 3) * 100}%`,
                  background:
                    "linear-gradient(90deg,#E63B21 0 33%,#1F3FAE 33% 66%,#E7A521 66% 100%)",
                  backgroundSize: "1400px 100%",
                }}
              />
            </div>
          </div>
        </section>

        {/* side-by-side output */}
        <section>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="bg-panel border-ink flex flex-col border-2">
              <div className="bg-ink text-paper flex items-center justify-between px-4 py-3">
                <span className="font-grotesk text-sm font-bold tracking-[0.12em] uppercase">
                  Original
                </span>
                <span className="text-paper/50 text-[11px] tracking-[0.15em] uppercase">
                  Source · {result?.sourceGrade ?? "unclassified"}
                </span>
              </div>
              <div className="space-y-4 p-6 text-[15px] leading-relaxed whitespace-pre-wrap text-ink/85">
                {sourceText}
              </div>
            </div>

            <div className="bg-panel border-ink flex flex-col border-2">
              <div className="bg-vermilion text-paper flex items-center justify-between px-4 py-3">
                <span className="font-grotesk text-sm font-bold tracking-[0.12em] uppercase">
                  Rewrite + Gaps
                </span>
                <span className="text-paper/70 text-[11px] tracking-[0.15em] uppercase">
                  {shortLang(language)} · {shortGrade(grade)}
                </span>
              </div>
              <div className="space-y-4 p-6 text-[15px] leading-relaxed text-ink/85">
                {!result && !busy && (
                  <p className="text-ink/40">
                    Choose a grade and language, then run Repurpose to see the rewritten page here.
                  </p>
                )}
                {busy && (
                  <div className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-ink/10 h-4 animate-pulse"
                        style={{ width: `${95 - i * 13}%` }}
                      />
                    ))}
                  </div>
                )}
                {result && (
                  <div className="rp-rise space-y-4">
                    <p className="font-grotesk text-lg font-bold text-ink">{result.title}</p>
                    {result.blocks.map((b, i) => {
                      if (b.kind === "formula")
                        return (
                          <div
                            key={i}
                            className="bg-ink text-paper font-grotesk py-4 text-center text-lg font-semibold tracking-wide"
                          >
                            {b.text}
                          </div>
                        );
                      if (b.kind === "gap")
                        return (
                          <GapCard
                            key={i}
                            block={b}
                            index={result.blocks
                              .filter((x) => x.kind === "gap")
                              .indexOf(b)}
                          />
                        );
                      return (
                        <p key={i}>
                          <Highlighted text={b.text} highlights={b.highlights ?? []} />
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink/60">
            <span className="flex items-center gap-2">
              <Swatch className="bg-mustard/60 size-3" /> Rewritten term
            </span>
            <span className="flex items-center gap-2">
              <Swatch className="bg-vermilion size-3" /> Curriculum gap flagged
            </span>
            <span className="flex items-center gap-2">
              <Swatch className="bg-sage size-3" /> Bridge lesson available
            </span>
          </div>
        </section>
      </main>

      <footer className="border-ink mt-8 border-t-2">
        <div className="bg-ink h-2 w-full">
          <div className="flex h-full">
            <Swatch className="bg-vermilion w-1/4" />
            <Swatch className="bg-mustard w-1/4" />
            <Swatch className="bg-cobalt w-1/4" />
            <Swatch className="bg-sage w-1/4" />
          </div>
        </div>
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 text-[13px] text-ink/50">
          <span>Repurpose · Built for migrant and refugee classrooms</span>
          <span className="font-grotesk font-semibold text-ink/70">Bauhaus grid edition</span>
        </div>
      </footer>
    </div>
  );
}
