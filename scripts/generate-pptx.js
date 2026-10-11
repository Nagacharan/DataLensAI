import pptxgen from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Presentation
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 13.333 x 7.5 inches
pres.author = "DataLens AI";
pres.company = "DataLens AI";
pres.title = "DataLens AI — Autonomous Data Intelligence Platform";

// Shared Theme Constants
const COLOR_BG = "F8FAFC"; // Clean soft slate off-white
const COLOR_WHITE = "FFFFFF";
const COLOR_CARD_BORDER = "E2E8F0";
const COLOR_PRIMARY = "FA5F38"; // Warm coral accent
const COLOR_NAVY = "0F172A"; // Deep navy header
const COLOR_BODY = "334155"; // Readable charcoal slate
const COLOR_MUTED = "64748B"; // Muted subtext
const COLOR_TEAL = "0D9488"; // Teal accent
const COLOR_PURPLE = "7C3AED"; // Purple accent

const FONT_TITLE = "Calibri";
const FONT_BODY = "Calibri";

// Helper to add standard slide header & footer
function addSlideChrome(slide, tagText, titleText, slideNum, totalSlides = 10) {
  // Slide background
  slide.background = { color: COLOR_BG };

  // Category Tag
  slide.addText(tagText.toUpperCase(), {
    x: 0.8,
    y: 0.46,
    w: 8.0,
    h: 0.25,
    fontFace: FONT_TITLE,
    fontSize: 10,
    bold: true,
    color: COLOR_PRIMARY,
    letterSpacing: 1.5
  });

  // Slide Title
  slide.addText(titleText, {
    x: 0.8,
    y: 0.72,
    w: 11.73,
    h: 0.58,
    fontFace: FONT_TITLE,
    fontSize: 23,
    bold: true,
    color: COLOR_NAVY
  });

  // Bottom Divider Line
  slide.addShape(pres.ShapeType.line, {
    x: 0.8,
    y: 6.85,
    w: 11.73,
    h: 0,
    line: { color: "E2E8F0", width: 1 }
  });

  // Footer text
  slide.addText("DataLens AI  •  Autonomous Data Intelligence & Audited Analytics", {
    x: 0.8,
    y: 6.95,
    w: 9.0,
    h: 0.35,
    fontFace: FONT_BODY,
    fontSize: 9,
    color: COLOR_MUTED
  });

  // Slide Number
  slide.addText(`${slideNum.toString().padStart(2, "0")} / ${totalSlides.toString().padStart(2, "0")}`, {
    x: 10.53,
    y: 6.95,
    w: 2.0,
    h: 0.35,
    align: "right",
    fontFace: FONT_BODY,
    fontSize: 9,
    bold: true,
    color: COLOR_MUTED
  });
}

// Helper to add a clean, well-proportioned card adjusted to layout
function addCard(slide, { x, y, w, h, icon, headline, bullets, borderColor = COLOR_CARD_BORDER, topBarColor = null, fontSize = 11.5, spaceAfter = 12 }) {
  // Background card box
  slide.addShape(pres.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: COLOR_WHITE },
    line: { color: borderColor, width: 1 }
  });

  // Top accent bar
  if (topBarColor) {
    slide.addShape(pres.ShapeType.roundRect, {
      x,
      y,
      w,
      h: 0.08,
      rectRadius: 0.04,
      fill: { color: topBarColor },
      line: { color: topBarColor, width: 1 }
    });
  }

  let textY = y + 0.30;

  // Icon + Headline
  const headlineText = icon ? `${icon}  ${headline}` : headline;
  slide.addText(headlineText, {
    x: x + 0.28,
    y: textY,
    w: w - 0.56,
    h: 0.42,
    fontFace: FONT_TITLE,
    fontSize: 14.5,
    bold: true,
    color: COLOR_NAVY
  });

  // Subtle interior divider line under card headline
  slide.addShape(pres.ShapeType.line, {
    x: x + 0.28,
    y: textY + 0.48,
    w: w - 0.56,
    h: 0,
    line: { color: "F1F5F9", width: 1 }
  });

  textY += 0.62;

  // Bullets with clean spacing
  if (bullets && bullets.length > 0) {
    const bulletObjects = bullets.map(b => ({
      text: b,
      options: {
        bullet: true,
        fontFace: FONT_BODY,
        fontSize,
        color: COLOR_BODY,
        lineSpacingMultiple: 1.2,
        spaceAfter
      }
    }));

    slide.addText(bulletObjects, {
      x: x + 0.28,
      y: textY,
      w: w - 0.56,
      h: h - (textY - y) - 0.22,
      valign: "top"
    });
  }
}

// Layout Dimensions for Perfect Symmetry across 13.333 x 7.5 inch slides
const START_Y = 1.48;
const CARD_H = 5.15;

// ==========================================
// SLIDE 1: Title Slide (Hero)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: COLOR_BG };

  // Hero Card Container
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 0.85,
    w: 11.73,
    h: 5.75,
    rectRadius: 0.12,
    fill: { color: COLOR_WHITE },
    line: { color: "CBD5E1", width: 1.5 }
  });

  // Top pill badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 1.4,
    y: 1.35,
    w: 3.8,
    h: 0.38,
    rectRadius: 0.19,
    fill: { color: "FFF1EE" },
    line: { color: "FDBA74", width: 1 }
  });

  slide.addText("🚀  AUTONOMOUS DATA ANALYST", {
    x: 1.4,
    y: 1.35,
    w: 3.8,
    h: 0.38,
    align: "center",
    fontFace: FONT_TITLE,
    fontSize: 9.5,
    bold: true,
    color: COLOR_PRIMARY,
    letterSpacing: 1
  });

  // Main Title
  slide.addText("DataLens AI", {
    x: 1.4,
    y: 1.95,
    w: 10.5,
    h: 0.95,
    fontFace: FONT_TITLE,
    fontSize: 44,
    bold: true,
    color: COLOR_NAVY
  });

  // Subtitle
  slide.addText("Autonomous Tabular Intelligence & Audited Analytics Platform", {
    x: 1.4,
    y: 2.95,
    w: 10.5,
    h: 0.45,
    fontFace: FONT_BODY,
    fontSize: 17,
    color: COLOR_PRIMARY,
    bold: true
  });

  // Tagline description
  slide.addText(
    "From raw spreadsheet or JSON file to verified statistics, interactive pastel charts, and executive PDF audit dossiers — in a single click.",
    {
      x: 1.4,
      y: 3.55,
      w: 10.2,
      h: 0.70,
      fontFace: FONT_BODY,
      fontSize: 13,
      color: COLOR_BODY
    }
  );

  // Interior Divider Line
  slide.addShape(pres.ShapeType.line, {
    x: 1.4,
    y: 4.45,
    w: 10.5,
    h: 0,
    line: { color: "F1F5F9", width: 1 }
  });

  // 3 Pill Feature Highlights
  const pills = [
    { text: "⚡ Zero Manual Config", x: 1.4 },
    { text: "🛡️ 100% Deterministic Math", x: 5.0 },
    { text: "📑 Boardroom PDF Export", x: 8.6 }
  ];

  pills.forEach(p => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: p.x,
      y: 4.75,
      w: 3.3,
      h: 0.48,
      rectRadius: 0.08,
      fill: { color: "F1F5F9" },
      line: { color: "E2E8F0", width: 1 }
    });
    slide.addText(p.text, {
      x: p.x,
      y: 4.75,
      w: 3.3,
      h: 0.48,
      align: "center",
      fontFace: FONT_BODY,
      fontSize: 11,
      bold: true,
      color: COLOR_NAVY
    });
  });

  // Bottom note
  slide.addText("Upload. Understand. Discover.", {
    x: 1.4,
    y: 5.80,
    w: 10.5,
    h: 0.35,
    fontFace: FONT_BODY,
    fontSize: 11,
    italic: true,
    color: COLOR_MUTED
  });
}

// ==========================================
// SLIDE 2: The Core Problem (3 Cards)
// ==========================================
{
  const slide = pres.addSlide();
  addSlideChrome(slide, "The Core Problem", "The Tabular Data Bottleneck", 2);

  const cardW = 3.65;
  const gap = 0.39;

  addCard(slide, {
    x: 0.80,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "⏳",
    headline: "Manual BI Fatigue",
    topBarColor: COLOR_PRIMARY,
    spaceAfter: 14,
    bullets: [
      "Traditional BI tools (Tableau, PowerBI) require heavy manual configuration.",
      "Users waste hours selecting columns, pivot axes, and formula aggregations.",
      "Steep learning curve blocks non-technical business professionals."
    ]
  });

  addCard(slide, {
    x: 0.80 + cardW + gap,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🧹",
    headline: "Messy Tabular Files",
    topBarColor: COLOR_TEAL,
    spaceAfter: 14,
    bullets: [
      "Real-world data arrives inconsistent: missing cells, duplicate records, and outliers.",
      "Multi-sheet Excel workbooks and nested JSON APIs break basic spreadsheet software.",
      "Analysts spend 80% of project time on dirty data wrangling rather than analysis."
    ]
  });

  addCard(slide, {
    x: 0.80 + (cardW + gap) * 2,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🤖",
    headline: "AI Hallucinations",
    topBarColor: COLOR_PURPLE,
    spaceAfter: 14,
    bullets: [
      "Generic LLM chatbots fabricate numbers, averages, and statistical correlations.",
      "Probabilistic models cannot perform deterministic mathematical arithmetic.",
      "Invented figures lead to catastrophic, untrusted business decisions."
    ]
  });
}

// ==========================================
// SLIDE 3: The Solution (3 Cards)
// ==========================================
{
  const slide = pres.addSlide();
  addSlideChrome(slide, "The Solution", "The Autonomous Data Analyst", 3);

  const cardW = 3.65;
  const gap = 0.39;

  addCard(slide, {
    x: 0.80,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "⚡",
    headline: "Zero-Config Profiling",
    topBarColor: COLOR_PRIMARY,
    spaceAfter: 14,
    bullets: [
      "Upload any dataset — DataLens AI immediately infers types and distributions.",
      "Distinguishes observed physical facts from inferred semantic column meanings.",
      "No statistical expertise or initial setup required."
    ]
  });

  addCard(slide, {
    x: 0.80 + cardW + gap,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🛡️",
    headline: "100% Deterministic Math",
    topBarColor: COLOR_TEAL,
    spaceAfter: 14,
    bullets: [
      "All metrics, correlations, and IQR bounds are computed in audited code.",
      "Zero LLM hallucination: AI only interprets verified calculations.",
      "Complete transparency and mathematical repeatability."
    ]
  });

  addCard(slide, {
    x: 0.80 + (cardW + gap) * 2,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "📑",
    headline: "Instant Boardroom Output",
    topBarColor: COLOR_PURPLE,
    spaceAfter: 14,
    bullets: [
      "Auto-generates relevant charts (donuts, clustered bars, histograms, scatters).",
      "Executive AI narratives explain findings in plain language.",
      "1-Click export to a multi-page PDF audit dossier with visual analytics."
    ]
  });
}

// ==========================================
// SLIDE 4: Architecture (2 Wide Cards)
// ==========================================
{
  const slide = pres.addSlide();
  addSlideChrome(slide, "System Architecture", "Deterministic Math + Semantic AI", 4);

  const cardW = 5.64;
  const gap = 0.45;

  addCard(slide, {
    x: 0.80,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "⚙️",
    headline: "Deterministic Calculation Engine",
    topBarColor: COLOR_TEAL,
    fontSize: 12,
    spaceAfter: 10,
    bullets: [
      "Runs locally in client code (JavaScript/Node.js).",
      "Universal Parsers: CSV, TSV, JSON (nested flatten), and multi-sheet XLSX.",
      "Computes verified statistics: min, max, mean, median, IQR bounds, Pearson r.",
      "Filters and prepares ML features (one-hot encoding, min-max scaling).",
      "Guarantees 0% numerical hallucination before any AI invocation."
    ]
  });

  addCard(slide, {
    x: 0.80 + cardW + gap,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🧠",
    headline: "Semantic AI Synthesizer",
    topBarColor: COLOR_PRIMARY,
    fontSize: 12,
    spaceAfter: 10,
    bullets: [
      "Powered by Google Gemini via secure local Express proxy.",
      "Translates verified mathematical facts into plain-English narratives.",
      "Explains practical business implications and analytical limitations.",
      "Strict safety guardrails: prohibited from inventing uncalculated figures.",
      "Answers conversational follow-up questions with mathematical evidence."
    ]
  });
}

// ==========================================
// SLIDE 5: 1-Click Data Quality (3 Cards)
// ==========================================
{
  const slide = pres.addSlide();
  addSlideChrome(slide, "Automated Hygiene", "1-Click Automated Data Quality", 5);

  const cardW = 3.65;
  const gap = 0.39;

  addCard(slide, {
    x: 0.80,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🔎",
    headline: "Autonomous Quality Audit",
    topBarColor: COLOR_PRIMARY,
    spaceAfter: 14,
    bullets: [
      "Scans every column for missing cells, duplicate rows, and type anomalies.",
      "Computes Tukey's IQR fences (Q1 - 1.5*IQR / Q3 + 1.5*IQR) to detect true outliers.",
      "Calculates an overall Data Health Score (0% to 100%)."
    ]
  });

  addCard(slide, {
    x: 0.80 + cardW + gap,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🪄",
    headline: "1-Click Batch Fixes",
    topBarColor: COLOR_TEAL,
    spaceAfter: 14,
    bullets: [
      "Recommends tailored treatments (median imputation, deduplication).",
      "One click applies all approved recommendations instantly.",
      "Eliminates hours of manual formula and regex writing."
    ]
  });

  addCard(slide, {
    x: 0.80 + (cardW + gap) * 2,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "↩️",
    headline: "Safe & 100% Reversible",
    topBarColor: COLOR_PURPLE,
    spaceAfter: 14,
    bullets: [
      "Never silently deletes or alters valid observations.",
      "Maintains an immutable snapshot of the original raw dataset.",
      "One-click Reset allows full rollback at any time for data lineage."
    ]
  });
}

// ==========================================
// SLIDE 6: Visual Analytics (3 Cards)
// ==========================================
{
  const slide = pres.addSlide();
  addSlideChrome(slide, "Dynamic Visualizations", "Context-Aware Visual Analytics", 6);

  const cardW = 3.65;
  const gap = 0.39;

  addCard(slide, {
    x: 0.80,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🍩",
    headline: "Adaptive Chart Selection",
    topBarColor: COLOR_PRIMARY,
    spaceAfter: 14,
    bullets: [
      "Donuts with center callouts for high-cardinality category splits.",
      "Clustered horizontal pastel bars for unit and performance benchmarks.",
      "Histograms with vertical reference lines showing the verified dataset mean."
    ]
  });

  addCard(slide, {
    x: 0.80 + cardW + gap,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "📈",
    headline: "Bivariate Relationships",
    topBarColor: COLOR_TEAL,
    spaceAfter: 14,
    bullets: [
      "Continuous scatter plots to uncover underlying relationships.",
      "Correlation matrix identifying leading drivers and collinear features.",
      "Dynamic trajectory curve charts for continuous metrics."
    ]
  });

  addCard(slide, {
    x: 0.80 + (cardW + gap) * 2,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🎨",
    headline: "Clean Executive Aesthetic",
    topBarColor: COLOR_PURPLE,
    spaceAfter: 14,
    bullets: [
      "Curated pastel palette: sage green, soft cream, and warm coral accents.",
      "Floating dark dock capsule navigation for uncluttered viewing.",
      "Zero visual noise — charts designed for immediate boardroom clarity."
    ]
  });
}

// ==========================================
// SLIDE 7: Conversational Co-Pilot (3 Cards)
// ==========================================
{
  const slide = pres.addSlide();
  addSlideChrome(slide, "Conversational Intelligence", "\"Ask Your Data\" with Verified Evidence", 7);

  const cardW = 3.65;
  const gap = 0.39;

  addCard(slide, {
    x: 0.80,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🗣️",
    headline: "Plain-English Questions",
    topBarColor: COLOR_PRIMARY,
    spaceAfter: 14,
    bullets: [
      "Ask natural questions: \"Which region had top sales?\" or \"Explain the dataset.\"",
      "Supports queries about distributions, missingness, and column statistics.",
      "Enables conversational follow-up questions seamlessly."
    ]
  });

  addCard(slide, {
    x: 0.80 + cardW + gap,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🔢",
    headline: "Evidence Proof Cards",
    topBarColor: COLOR_TEAL,
    spaceAfter: 14,
    bullets: [
      "Every answer includes interactive evidence chips.",
      "Displays the verified mathematical proof (exact totals, averages, records).",
      "Users can audit and trust every single numerical response."
    ]
  });

  addCard(slide, {
    x: 0.80 + (cardW + gap) * 2,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🚫",
    headline: "Gibberish Guardrails",
    topBarColor: COLOR_PURPLE,
    spaceAfter: 14,
    bullets: [
      "Rejects vague or nonsensical inputs (e.g. \"asdf\", \"???\").",
      "Cleanly responds: \"Please give the question properly.\" rather than guessing.",
      "Strict hallucination guard preventing fabricated context."
    ]
  });
}

// ==========================================
// SLIDE 8: Executive PDF Dossier (2 Wide Cards)
// ==========================================
{
  const slide = pres.addSlide();
  addSlideChrome(slide, "Executive Reporting", "Multi-Page Executive PDF Report", 8);

  const cardW = 5.64;
  const gap = 0.45;

  addCard(slide, {
    x: 0.80,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "📑",
    headline: "Executive Audit Dossier",
    topBarColor: COLOR_PRIMARY,
    fontSize: 12,
    spaceAfter: 12,
    bullets: [
      "Formal cover page with dataset metadata, row counts, and timestamp.",
      "Comprehensive Data Health Assessment and missingness breakdown table.",
      "Statistical distribution audit with parametric metrics for all columns.",
      "Strategic AI findings explaining key trends and analytical limitations."
    ]
  });

  addCard(slide, {
    x: 0.80 + cardW + gap,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "📊",
    headline: "Page-by-Page Visual Analytics",
    topBarColor: COLOR_TEAL,
    fontSize: 12,
    spaceAfter: 12,
    bullets: [
      "Vector-quality charts embedded directly into the document.",
      "Category comparisons, continuous distributions, and scatter plots.",
      "Generated in 2 seconds without tedious copy-pasting into Word.",
      "Consistent 100% numerical match with the live dashboard."
    ]
  });
}

// ==========================================
// SLIDE 9: The 4-Step User Journey (4 Cards)
// ==========================================
{
  const slide = pres.addSlide();
  addSlideChrome(slide, "User Journey", "From Raw File to Insight in 4 Steps", 9);

  const cardW = 2.70;
  const gap = 0.31;

  addCard(slide, {
    x: 0.80,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "1️⃣",
    headline: "Upload",
    topBarColor: COLOR_PRIMARY,
    fontSize: 11,
    spaceAfter: 16,
    bullets: [
      "Drag & drop CSV, TSV, JSON, or multi-sheet Excel.",
      "Instant schema parser normalizes data structures."
    ]
  });

  addCard(slide, {
    x: 0.80 + cardW + gap,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "2️⃣",
    headline: "Profile & Clean",
    topBarColor: COLOR_TEAL,
    fontSize: 11,
    spaceAfter: 16,
    bullets: [
      "Inspect observed facts vs inferred column meanings.",
      "1-Click apply batch hygiene fixes with full undo safety."
    ]
  });

  addCard(slide, {
    x: 0.80 + (cardW + gap) * 2,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "3️⃣",
    headline: "Discover",
    topBarColor: COLOR_PURPLE,
    fontSize: 11,
    spaceAfter: 16,
    bullets: [
      "Explore adaptive pastel charts & KPI benchmark cards.",
      "Read AI narratives grounded in verified statistics."
    ]
  });

  addCard(slide, {
    x: 0.80 + (cardW + gap) * 3,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "4️⃣",
    headline: "Ask & Export",
    topBarColor: COLOR_NAVY,
    fontSize: 11,
    spaceAfter: 16,
    bullets: [
      "Chat with conversational co-pilot for on-demand metrics.",
      "Download multi-page PDF audit dossier for stakeholders."
    ]
  });
}

// ==========================================
// SLIDE 10: Summary & Impact (3 Cards)
// ==========================================
{
  const slide = pres.addSlide();
  addSlideChrome(slide, "Summary & Impact", "Why DataLens AI Wins", 10);

  const cardW = 3.65;
  const gap = 0.39;

  addCard(slide, {
    x: 0.80,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "⏱️",
    headline: "30 Min ➔ 3 Seconds",
    topBarColor: COLOR_PRIMARY,
    spaceAfter: 14,
    bullets: [
      "Replaces tedious manual exploratory data analysis with instant answers.",
      "Democratizes business intelligence for non-technical users and analysts alike.",
      "Zero initial setup or expensive proprietary BI software licensing."
    ]
  });

  addCard(slide, {
    x: 0.80 + cardW + gap,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🔒",
    headline: "Local-First Privacy",
    topBarColor: COLOR_TEAL,
    spaceAfter: 14,
    bullets: [
      "Client-side processing preserves complete data confidentiality.",
      "Raw spreadsheet rows are never persisted to external cloud databases.",
      "API keys and enterprise secrets remain protected."
    ]
  });

  addCard(slide, {
    x: 0.80 + (cardW + gap) * 2,
    y: START_Y,
    w: cardW,
    h: CARD_H,
    icon: "🛡️",
    headline: "Mathematical Trust",
    topBarColor: COLOR_PURPLE,
    spaceAfter: 14,
    bullets: [
      "Deterministic-first architecture completely eliminates AI hallucinations.",
      "Every chart and insight is anchored in audited mathematical reality.",
      "Empowers stakeholders with trustworthy, actionable decisions."
    ]
  });
}

// Generate the file
const primaryPath = path.resolve(__dirname, "../DataLens_AI_Presentation.pptx");
const adjustedPath = path.resolve(__dirname, "../DataLens_AI_Presentation_Adjusted.pptx");

try {
  await pres.writeFile({ fileName: primaryPath });
  console.log("✅ Presentation generated successfully at:", primaryPath);
} catch (err) {
  if (err.code === "EBUSY") {
    console.warn("⚠️ DataLens_AI_Presentation.pptx is locked by PowerPoint. Writing to DataLens_AI_Presentation_Adjusted.pptx instead...");
    await pres.writeFile({ fileName: adjustedPath });
    console.log("✅ Adjusted presentation generated successfully at:", adjustedPath);
  } else {
    console.error("❌ Failed to generate presentation:", err);
    process.exit(1);
  }
}
