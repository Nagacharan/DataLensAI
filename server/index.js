import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Determine available AI provider
const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(geminiApiKey);
  } catch (err) {
    console.warn('[DataLens AI Server] Could not initialize Gemini client:', err.message);
  }
}

// 1. Health & Config endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'DataLens AI Analytical Backend',
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    aiConfigured: Boolean(genAI),
    provider: genAI ? 'Google Gemini' : 'Deterministic Analytics Engine',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  });
});

// 2. AI Insights Enhancement endpoint
app.post('/api/ai/insights', async (req, res) => {
  try {
    const { datasetSummary, profileStats, numericInsights } = req.body;

    if (!genAI) {
      // Fallback: return deterministic enhancements
      return res.json({
        success: true,
        provider: 'Deterministic Analytical Engine',
        insights: numericInsights || [],
        narrative: `Dataset analysis complete. Evaluated ${profileStats?.rowCount || 0} observations across ${profileStats?.columnCount || 0} attributes with a data quality health score of ${profileStats?.dataQualityScore || 100}/100.`,
      });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `You are a senior data scientist and business analyst reviewing a dataset named "${datasetSummary?.fileName || 'Dataset'}".
Here are mathematically verified statistics calculated deterministically by the application:
- Row count: ${profileStats?.rowCount}
- Column count: ${profileStats?.columnCount}
- Missing values: ${profileStats?.missingCellsPercent}%
- Quality score: ${profileStats?.dataQualityScore}/100
- Pre-computed findings:
${JSON.stringify(numericInsights, null, 2)}

Provide a concise, high-impact executive summary paragraph (3-4 sentences) synthesizing these exact findings for leadership. Do not invent any numbers. Rely strictly on the supplied facts.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const narrativeText = response.text();

    res.json({
      success: true,
      provider: 'Google Gemini',
      insights: numericInsights,
      narrative: narrativeText.trim(),
    });
  } catch (error) {
    console.error('[AI Insights Error]:', error.message);
    // Graceful fallback on API error/rate-limit
    res.json({
      success: true,
      provider: 'Deterministic Analytical Engine (Fallback)',
      insights: req.body.numericInsights || [],
      narrative: `Deterministic analysis executed: Observed ${req.body.profileStats?.rowCount || 0} rows and ${req.body.profileStats?.columnCount || 0} features. Data quality index rated at ${req.body.profileStats?.dataQualityScore || 100}/100.`,
      warning: `LLM service unavailable: ${error.message}`,
    });
  }
});

// 3. Ask Your Data AI Q&A endpoint
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, verifiedCalculation, datasetMetadata, conversationHistory } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    if (verifiedCalculation?.intent === 'IMPROPER_QUESTION') {
      return res.json({
        success: true,
        provider: 'DataLens Assistant',
        answer: 'Please give the question properly.',
        evidence: [],
        chartData: null,
      });
    }

    if (!genAI) {
      // Return the deterministic answer directly
      return res.json({
        success: true,
        provider: 'Deterministic Engine',
        answer: verifiedCalculation?.answer || `Analyzed your question based on ${datasetMetadata?.totalRows || 0} records.`,
        evidence: verifiedCalculation?.evidence || [],
        chartData: verifiedCalculation?.chartData || null,
      });
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `You are DataLens AI, a precise analytics co-pilot.
A user asked: "${question}"

The deterministic code has already computed the following verified facts from the dataset:
- Calculation result / intent: ${verifiedCalculation?.intent}
- Base answer: ${verifiedCalculation?.answer}
- Evidence items: ${JSON.stringify(verifiedCalculation?.evidence || [])}
- Dataset: ${datasetMetadata?.fileName} (${datasetMetadata?.totalRows} rows, ${datasetMetadata?.totalColumns} columns)

Respond with a direct, conversational, 2-3 sentence answer explaining these exact numerical findings clearly according to the question asked.
RULES:
1. NEVER invent any statistics or numbers that are not in the provided evidence.
2. Answer specifically and only according to what the user asked. Do NOT provide generic boilerplate summaries or unsolicited column dumps.
3. If the user's prompt is gibberish, improper, or not a meaningful question, respond strictly with: "Please give the question properly."
4. If there are caveats (like small sample size or missing values), mention them gently.
5. Be professional, clear, and helpful.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answerText = response.text();

    res.json({
      success: true,
      provider: 'Google Gemini',
      answer: answerText.trim(),
      evidence: verifiedCalculation?.evidence || [],
      chartData: verifiedCalculation?.chartData || null,
    });
  } catch (error) {
    console.error('[Ask AI Error]:', error.message);
    // Graceful fallback to verified deterministic calculation
    res.json({
      success: true,
      provider: 'Deterministic Engine (Fallback)',
      answer: req.body.verifiedCalculation?.answer || 'Analytical calculation completed.',
      evidence: req.body.verifiedCalculation?.evidence || [],
      chartData: req.body.verifiedCalculation?.chartData || null,
      warning: `AI provider returned error: ${error.message}`,
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[DataLens AI Server] Running on http://localhost:${PORT}`);
  console.log(`[DataLens AI Server] AI Provider: ${genAI ? 'Google Gemini Active' : 'Deterministic Mode (No GEMINI_API_KEY set)'}`);
});
