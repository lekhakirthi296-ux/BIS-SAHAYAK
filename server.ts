import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { ai, callGeminiWithFallback } from './server/gemini.ts';
import { db } from './server/db.ts';
import { hybridRetrieval } from './server/retrieval.ts';
import { analyzeQuery } from './server/queryAnalyzer.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'bis-admin-secret-key';

// In-memory rate limiter (60 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return next();
  }

  if (entry.count >= 60) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a minute before trying again.',
    });
  }

  entry.count += 1;
  next();
}

// Global Middlewares
app.use(rateLimiter);
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Multer in-memory storage (10 MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// Load standards and licenses datasets into memory for fast lookup
const standardsPath = path.resolve(process.cwd(), 'data', 'standards.json');
const licensesPath = path.resolve(process.cwd(), 'data', 'licenses.json');

function getStandardsData() {
  try {
    if (fs.existsSync(standardsPath)) {
      return JSON.parse(fs.readFileSync(standardsPath, 'utf-8')).standards || [];
    }
  } catch (e) {
    console.error('Error reading standards.json:', e);
  }
  return [];
}

function getLicensesData() {
  try {
    if (fs.existsSync(licensesPath)) {
      return JSON.parse(fs.readFileSync(licensesPath, 'utf-8')).licenses || [];
    }
  } catch (e) {
    console.error('Error reading licenses.json:', e);
  }
  return [];
}

// ---------------- API ROUTES ----------------

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// 2. Chat endpoint (Hybrid Retrieval-grounded Q&A with Query Analysis)
app.post('/api/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, language = 'en', audience = 'industry', history = [], sessionId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Valid message string is required.' });
    }

    const currentSessionId = sessionId || `session-${Date.now()}`;
    const userQuery = message.trim();

    // Step 1: Query Understanding & Intent Detection
    const { standaloneQuery, intent } = await analyzeQuery(userQuery, history);

    // Step 2: Handle Greetings / Smalltalk without retrieval
    if (intent === 'smalltalk') {
      const greetingAnswer =
        language === 'hi'
          ? `नमस्ते! मैं **बीआईएस सहायक (BIS Sahayak)** हूँ, भारतीय मानकों (Indian Standards) और बीआईएस सेवाओं के लिए आपका आधिकारिक एआई सहायक।\n\nमैं आपकी निम्न प्रमुख सेवाओं में सहायता कर सकता हूँ:\n- **भारतीय मानक एवं क्यूसीओ (QCO)**: हेलमेट, गीजर/वाटर हीटर, खिलौने, इलेक्ट्रॉनिक्स, केबल एवं खाद्य पदार्थों के मानक।\n- **प्रमाणन प्रक्रियाएँ**: आईएसआई मार्क (स्कीम-I), अनिवार्य पंजीकरण (CRS स्कीम-II), एवं विदेशी निर्माताओं हेतु एफएमसीएस (FMCS)।\n- **हॉलमार्किंग**: सोने एवं चांदी के आभूषणों की शुद्धता और 6-अंकीय HUID का सत्यापन।\n- **लाइसेंस जांच एवं शिकायतें**: CM/L नंबर की जांच तथा घटिया सामान या नकली मार्क की शिकायत दर्ज करना।\n\nआज मैं आपकी क्या सहायता कर सकता हूँ?`
          : `Hello! I am **BIS Sahayak**, your official AI Assistant for Indian Standards and Bureau of Indian Standards (BIS) services.\n\nI can assist you across all official regulatory topics:\n- **Indian Standards & QCOs**: Finding standards for helmets, electrical appliances, water heaters, toys, cables, steel, and packaged water.\n- **Certification Schemes**: Step-by-step guidance for ISI Mark (Scheme-I), Compulsory Registration (CRS Scheme-II), and FMCS for foreign manufacturers.\n- **Hallmarking**: Verifying gold and silver jewellery purity and 6-digit HUID authenticity.\n- **License Verification & Complaints**: Checking CM/L and R-numbers, or filing grievances against fake marks under the BIS Act 2016.\n\nHow can I help you today?`;

      const followUps = [
        'Which mark is needed for helmets?',
        'How do I register electronics under CRS?',
        'What is a QCO?',
      ];

      const messageId = `msg-${Date.now()}`;
      const userMsg = {
        id: `u-${Date.now()}`,
        role: 'user' as const,
        content: userQuery,
        timestamp: new Date().toISOString(),
      };
      const asstMsg = {
        id: messageId,
        role: 'assistant' as const,
        content: greetingAnswer,
        confidence: 'high' as const,
        citations: [],
        followUps,
        timestamp: new Date().toISOString(),
      };
      db.appendMessages(currentSessionId, userMsg, asstMsg);

      return res.json({
        messageId,
        sessionId: currentSessionId,
        answer: greetingAnswer,
        citations: [],
        confidence: 'high',
        followUps,
        debug: {
          intent,
          standaloneQuery,
          retrievedChunks: [],
        },
      });
    }

    // Step 3: Hybrid Retrieval (BM25 + Stemming + Synonyms + Gemini Embeddings + IS Boost)
    const scoredResults = await hybridRetrieval.searchHybrid(standaloneQuery, 6);

    // Prepare retrieved sources text
    const sourcesText = scoredResults
      .map(
        (sr, i) =>
          `[Source ${i + 1}] ID: ${sr.chunk.id}\nTitle: ${sr.chunk.title}\nSource: ${sr.chunk.source}\nURL: ${sr.chunk.url}\nDate: ${sr.chunk.lastUpdated}\nContent: ${sr.chunk.content}`
      )
      .join('\n\n');

    // Step 4: System Instruction per revised prompt rules
    const systemInstruction = `You are "BIS Sahayak", the authoritative AI assistant for the Bureau of Indian Standards (BIS), Government of India, assisting ${audience === 'industry' ? 'manufacturers, importers, MSMEs, and test laboratories' : 'consumers, buyers, and citizens'}.

CRITICAL SYSTEM RULES:
1. Use the provided sources first and cite them accurately (e.g. referencing the Indian Standard like IS 4151 or scheme name).
2. If the sources only partly answer the user's question, give the part you can support and clearly say what is missing.
3. For general BIS questions not fully in the sources, give a short, helpful general answer labelled 'General guidance, verify on bis.gov.in'.
4. Never invent IS numbers, fees, or dates.
5. If the question is completely unrelated to BIS, Indian Standards, or product quality, politely indicate that it is not covered in BIS records and suggest contacting the BIS Care line (1800-11-0001 / bis.gov.in).
6. Reply in the user's chosen language: "${language}" (e.g. en for English, hi for Hindi, ta for Tamil, te for Telugu, bn for Bengali, mr for Marathi).
7. Format your response cleanly with clear markdown, bullet points, and bold Indian Standard numbers (e.g. **IS 4151**, **IS 302**).
8. Provide 2 to 3 practical follow-up questions at the very end in a clearly labeled section: "Suggested Follow-ups:".`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `RETRIEVED BIS KNOWLEDGE SOURCES:\n${sourcesText || 'None available'}\n\nUSER STANDALONE QUERY: ${standaloneQuery}\n(Original input: "${userQuery}")\n\nPlease answer the user's question following the system rules.`,
          },
        ],
      },
    ];

    const geminiResult = await callGeminiWithFallback(async (modelName) => {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
      return resp.text || '';
    });

    // Extract follow-ups from the text if present
    const followUps: string[] = [];
    let cleanAnswer = geminiResult;
    const followUpMarker = /Suggested Follow-ups:?([\s\S]*)$/i;
    const match = cleanAnswer.match(followUpMarker);
    if (match && match[1]) {
      const lines = match[1].split('\n').filter((l) => l.trim().length > 3);
      lines.forEach((l) => {
        const clean = l.replace(/^[-*•\d.]+\s*/, '').trim();
        if (clean && clean.length > 5 && followUps.length < 3) {
          followUps.push(clean);
        }
      });
      cleanAnswer = cleanAnswer.replace(followUpMarker, '').trim();
    }

    if (followUps.length === 0) {
      if (intent === 'verify') {
        followUps.push('How to verify an ISI mark on BIS CARE App?', 'What is a 6-digit HUID?');
      } else if (intent === 'complaint') {
        followUps.push('What are the penalties under Section 29 of BIS Act?', 'What evidence do I need to attach?');
      } else if (intent === 'certification') {
        followUps.push('What is the Simplified Procedure for ISI license?', 'What are the MSME fee concessions?');
      } else {
        followUps.push('What is a QCO?', 'Which products have mandatory ISI mark?');
      }
    }

    // Determine citations from top retrieved chunks
    const citations = scoredResults.slice(0, 4).map((sr) => ({
      title: sr.chunk.title,
      source: sr.chunk.source,
      url: sr.chunk.url,
      lastUpdated: sr.chunk.lastUpdated,
      content: sr.chunk.content,
    }));

    const topScore = scoredResults.length > 0 ? scoredResults[0].score : 0;
    const topCosine = scoredResults.length > 0 ? scoredResults[0].cosineScore : 0;
    const confidence: 'high' | 'medium' | 'low' =
      topScore >= 12.0 || topCosine >= 0.75 ? 'high' : topScore >= 4.0 || topCosine >= 0.55 ? 'medium' : 'low';

    const messageId = `msg-${Date.now()}`;

    // Debug payload for hidden ?debug=1 inspection
    const debugInfo = {
      intent,
      standaloneQuery,
      retrievedChunks: scoredResults.map((sr) => ({
        id: sr.chunk.id,
        title: sr.chunk.title,
        score: sr.score,
        bm25Score: sr.bm25Score,
        cosineScore: sr.cosineScore,
        combinedScore: sr.combinedScore,
        matchReasons: sr.matchReasons,
      })),
    };

    // Persist in DB
    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user' as const,
      content: userQuery,
      timestamp: new Date().toISOString(),
    };
    const asstMsg = {
      id: messageId,
      role: 'assistant' as const,
      content: cleanAnswer,
      citations,
      confidence,
      followUps,
      timestamp: new Date().toISOString(),
    };
    db.appendMessages(currentSessionId, userMsg, asstMsg);

    return res.json({
      messageId,
      sessionId: currentSessionId,
      answer: cleanAnswer,
      citations,
      confidence,
      followUps,
      debug: debugInfo,
    });
  } catch (err: any) {
    next(err);
  }
});

// 3. Standards Finder (Search & Filter)
app.get('/api/standards', (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim().toLowerCase();
  const category = (req.query.category as string) || '';
  const scheme = (req.query.scheme as string) || '';
  const qcoOnly = req.query.qco === 'true';
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.max(1, Math.min(50, parseInt((req.query.limit as string) || '10', 10)));

  db.incrementStandardsSearch();
  const allStandards = getStandardsData();

  // Extract unique categories and schemes for filters
  const categories = Array.from(new Set(allStandards.map((s: any) => s.productCategory))).filter(Boolean);
  const schemes = Array.from(new Set(allStandards.map((s: any) => s.scheme))).filter(Boolean);

  let filtered = allStandards.filter((std: any) => {
    if (category && std.productCategory !== category) return false;
    if (scheme && std.scheme !== scheme) return false;
    if (qcoOnly && !std.qcoApplicable) return false;

    if (q) {
      const matchIs = std.isNumber.toLowerCase().includes(q);
      const matchTitle = std.title.toLowerCase().includes(q);
      const matchScope = std.scopeSummary.toLowerCase().includes(q);
      const matchCat = std.productCategory.toLowerCase().includes(q);
      return matchIs || matchTitle || matchScope || matchCat;
    }
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  res.json({
    standards: paginated,
    total,
    page,
    limit,
    totalPages,
    categories,
    schemes,
  });
});

// 4. Certification Guide Wizard
app.post('/api/certification-guide', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productName, productType = 'General', manufacturerType = 'indian', isMSME = false } = req.body;

    if (!productName || typeof productName !== 'string' || !productName.trim()) {
      return res.status(400).json({ error: 'Product name is required.' });
    }

    const allStandards = getStandardsData();
    // Find potential standard matches from local database
    const matchingStandards = allStandards.filter(
      (s: any) =>
        s.title.toLowerCase().includes(productName.toLowerCase()) ||
        s.productCategory.toLowerCase().includes(productName.toLowerCase()) ||
        productName.toLowerCase().includes(s.productCategory.toLowerCase().split(' ')[0])
    );

    const promptContext = `Product Name: ${productName}
Product Type/Description: ${productType}
Manufacturer Location: ${manufacturerType === 'foreign' ? 'Overseas / Foreign Manufacturer (FMCS path)' : 'Domestic / Indian Manufacturer'}
MSME Status: ${isMSME ? 'Yes, MSME (Eligible for Udyam fee concessions)' : 'No / Large Enterprise'}
Relevant Known Standards: ${matchingStandards.map((s: any) => `${s.isNumber} (${s.title}, Scheme: ${s.scheme})`).join('; ') || 'None directly matched'}`;

    const systemInstruction = `You are a Senior BIS Technical Certification Consultant.
Your task is to provide a structured, official-grade certification roadmap for the manufacturer.
Every step must strictly align with BIS Conformity Assessment Regulations (Scheme-I ISI, Scheme-II CRS, Scheme-IV Hallmarking, or FMCS for foreign manufacturers).
If a specific Indian Standard or fee is not definitively known, explicitly state "Confirm with BIS". Do not invent non-existent IS numbers.

Return a valid JSON object matching this exact schema:
{
  "likelyScheme": "ISI" | "CRS" | "Hallmark" | "FMCS" | "Other" | "Unknown",
  "applicableStandards": ["IS Number: Standard Title"],
  "steps": ["Step 1 description", "Step 2 description", ...],
  "documentChecklist": ["Document 1", "Document 2", ...],
  "estimatedTimeline": "e.g. 30 to 45 days (Simplified Procedure) or Confirm with BIS",
  "msmeBenefits": "Summary of 50% / 20% fee rebate if applicable",
  "notes": "Important testing or factory setup requirements",
  "disclaimer": "This guidance is generated for advisory purposes. Official requirements must be verified on manakonline.in."
}`;

    const geminiResult = await callGeminiWithFallback(async (modelName) => {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: promptContext,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      return resp.text || '{}';
    });

    let parsedGuide;
    try {
      parsedGuide = JSON.parse(geminiResult);
    } catch {
      parsedGuide = {
        likelyScheme: manufacturerType === 'foreign' ? 'FMCS' : 'ISI',
        applicableStandards: matchingStandards.map((s: any) => `${s.isNumber}: ${s.title}`),
        steps: [
          'Register on BIS Manak Online portal (manakonline.in)',
          'Identify relevant Indian Standard and set up in-house testing facility',
          'Submit factory sample for pre-testing at a BIS-recognized laboratory',
          'Submit online application with test reports and manufacturing documentation',
          'Undergo BIS factory audit and grant of CM/L license number',
        ],
        documentChecklist: [
          'Manufacturing Process Flowchart',
          'List of In-house Testing Equipment calibrated to standards',
          'Factory Layout and Proof of Premises (Industrial License/Consent)',
          'Authorized Indian Representative (AIR) document (if foreign manufacturer)',
          isMSME ? 'Udyam Registration Certificate for MSME fee concessions' : 'Company Registration Certificate',
        ],
        estimatedTimeline: '30 to 60 days under Simplified Procedure',
        msmeBenefits: isMSME ? '50% concession on application and annual minimum marking fees for Micro enterprises, 20% for Small enterprises.' : 'Standard fee structure applies.',
        notes: 'Ensure all calibration records of test instruments are current before scheduling BIS inspection.',
        disclaimer: 'This guidance is generated for advisory purposes. Official requirements must be verified on manakonline.in.',
      };
    }

    res.json(parsedGuide);
  } catch (err: any) {
    next(err);
  }
});

// 5. Verify License (Lookup against demo dataset)
app.get('/api/verify-license', (req: Request, res: Response) => {
  const type = ((req.query.type as string) || '').trim().toUpperCase();
  const rawNumber = ((req.query.number as string) || '').trim();

  if (!rawNumber) {
    return res.status(400).json({ error: 'License or registration number is required.' });
  }

  db.incrementLicensesVerified();
  const allLicenses = getLicensesData();

  // Normalize number for comparison (ignore whitespace, hyphens, and case)
  const cleanNumber = rawNumber.replace(/[\s-]/g, '').toLowerCase();

  const foundLicense = allLicenses.find((lic: any) => {
    const licNumClean = lic.number.replace(/[\s-]/g, '').toLowerCase();
    const typeMatch = !type || lic.type.toUpperCase() === type;
    return typeMatch && (licNumClean === cleanNumber || licNumClean.includes(cleanNumber) || cleanNumber.includes(licNumClean));
  });

  if (!foundLicense) {
    return res.json({
      found: false,
      status: 'not_found',
      license: null,
      searchedType: type || 'ALL',
      searchedNumber: rawNumber,
      disclaimer: 'Demo data – verify on the official BIS portal (manakonline.in / crsbis.in / BIS CARE app)',
      officialVerificationUrl: 'https://www.manakonline.in/MANAK/SearchLicence',
    });
  }

  return res.json({
    found: true,
    status: foundLicense.status,
    license: foundLicense,
    searchedType: foundLicense.type,
    searchedNumber: rawNumber,
    disclaimer: 'Demo data – verify on the official BIS portal (manakonline.in / crsbis.in / BIS CARE app)',
    officialVerificationUrl:
      foundLicense.type === 'CRS'
        ? 'https://www.crsbis.in/BIS/appStatus.do'
        : foundLicense.type === 'HALLMARK'
        ? 'https://www.manakonline.in/MANAK/HUID'
        : 'https://www.manakonline.in/MANAK/SearchLicence',
  });
});

// 6. Complaint Draft Generator
app.post('/api/complaint-draft', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productName, brand, issue, purchaseDate, language = 'en', isNumber, sellerName } = req.body;

    if (!productName || !issue) {
      return res.status(400).json({ error: 'Product name and issue description are required.' });
    }

    const systemInstruction = `You are a Consumer Rights & Legal Advocate specializing in the Bureau of Indian Standards (BIS) Act, 2016 and the Consumer Protection Act, 2019.
Draft a formal, assertive, and respectful legal complaint letter regarding substandard products, defective goods, or fraudulent ISI/Hallmark markings.
Provide the response strictly in JSON format with keys:
{
  "subject": "Clear concise subject line with standard/product reference",
  "recipient": "The Branch Head / Enforcement Wing, Bureau of Indian Standards & The Grievance Officer",
  "letter": "Full letter body with placeholder brackets for [Complainant Name, Address, Contact] and detailed chronological grievances",
  "filingSteps": ["Step 1 on BIS CARE App / Portal", "Step 2 on NCH", "Step 3 legal notice"],
  "bisChannels": ["BIS CARE App (File Complaint)", "complaints@bis.gov.in", "Toll-Free 1800-11-0001"],
  "requiredEvidence": ["Tax Invoice", "Photographs of product label and ISI CM/L mark", "Lab/Test failure observations"]
}`;

    const promptText = `Product: ${productName}
Brand: ${brand || 'Unknown'}
Seller / Store: ${sellerName || 'Retailer / Online Marketplace'}
Date of Purchase: ${purchaseDate || 'Recent'}
Indian Standard (if known): ${isNumber || 'Not specified'}
Issue Description: ${issue}
Language for the letter: ${language}`;

    const geminiResult = await callGeminiWithFallback(async (modelName) => {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      return resp.text || '{}';
    });

    let parsedResult;
    try {
      parsedResult = JSON.parse(geminiResult);
    } catch {
      parsedResult = {
        subject: `Complaint regarding substandard ${productName} (Brand: ${brand || 'N/A'}) under BIS Act 2016`,
        recipient: 'The Head (Consumer Affairs & Enforcement Department), Bureau of Indian Standards',
        letter: `To,\nThe Head (Consumer Affairs Department)\nBureau of Indian Standards\n\nRespected Sir/Madam,\n\nSubject: Formal Complaint regarding Substandard / Non-compliant ${productName}\n\nI am writing to lodge a formal complaint against the product '${productName}' manufactured/sold by ${brand || 'the vendor'}. The product was purchased on ${purchaseDate || 'recently'} and has demonstrated severe defects: ${issue}.\n\nUnder Section 17 & 29 of the BIS Act 2016, placing non-compliant or counterfeit goods on the Indian market is a punishable offense. I request an official investigation, market sample seizure, and appropriate restitution.\n\nYours faithfully,\n[Complainant Name]\n[Contact Information]`,
        filingSteps: [
          'Open BIS CARE Mobile App and tap "File a Complaint"',
          'Select complaint category (Misuse of ISI Mark or Quality Defect)',
          'Upload invoice and photos of the product and serial/batch number',
          'Track grievance resolution on manakonline.in',
        ],
        bisChannels: ['BIS CARE Mobile App', 'complaints@bis.gov.in', 'National Toll-Free 1800-11-0001'],
        requiredEvidence: [
          'Purchase Tax Invoice with GSTIN',
          'High-resolution photos of product marking and CM/L number',
          'Packaging showing batch number and manufacturer address',
        ],
      };
    }

    res.json(parsedResult);
  } catch (err: any) {
    next(err);
  }
});

// 7. Voice Input Transcription (POST /api/transcribe)
app.post('/api/transcribe', upload.single('audio'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required.' });
    }

    const mimeType = req.file.mimetype || 'audio/webm';
    const base64Audio = req.file.buffer.toString('base64');

    const audioPart = {
      inlineData: {
        mimeType: mimeType.includes('audio') || mimeType.includes('video') ? mimeType : 'audio/webm',
        data: base64Audio,
      },
    };

    const textPart = {
      text: 'Transcribe this voice query accurately in the spoken language. Do not add conversational prefixes; return only the exact transcription.',
    };

    const transcript = await callGeminiWithFallback(async (modelName) => {
      // Prefer transcribe model or standard flash
      const targetModel = modelName === 'gemini-2.5-flash-lite' ? 'gemini-3.5-transcribe' : modelName;
      const resp = await ai.models.generateContent({
        model: targetModel,
        contents: { parts: [audioPart, textPart] },
      });
      return resp.text?.trim() || '';
    });

    res.json({ transcript });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Voice transcription could not be completed. Please type your query.' });
  }
});

// 8. Label Scan (POST /api/label-scan)
app.post('/api/label-scan', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Product label image is required.' });
    }

    const mimeType = req.file.mimetype || 'image/jpeg';
    const base64Image = req.file.buffer.toString('base64');

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    };

    const promptPart = {
      text: `You are an expert BIS Compliance and Quality Enforcement Inspector.
Analyze this product label image carefully for Bureau of Indian Standards markings.
Extract the following information and return strict JSON:
{
  "isiMarkDetected": boolean,
  "crsMarkDetected": boolean,
  "hallmarkDetected": boolean,
  "isNumber": string | null,
  "registrationOrCml": string | null,
  "brandOrManufacturer": string | null,
  "productType": string | null,
  "markAuthenticity": "Format Valid" | "Missing Standard / CM/L" | "Suspicious / Irregular" | "No BIS Mark Present",
  "observations": "Brief explanation of what was seen on the label (e.g. ISI mark found with IS 302-2-21 and CM/L-8400123456)",
  "recommendedAction": "e.g. Verify the CM/L number on the official BIS CARE app or manakonline.in"
}`,
    };

    const geminiResult = await callGeminiWithFallback(async (modelName) => {
      const resp = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [imagePart, promptPart] },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      return resp.text || '{}';
    });

    let parsedScan;
    try {
      parsedScan = JSON.parse(geminiResult);
    } catch {
      parsedScan = {
        isiMarkDetected: false,
        crsMarkDetected: false,
        hallmarkDetected: false,
        isNumber: null,
        registrationOrCml: null,
        brandOrManufacturer: null,
        productType: null,
        markAuthenticity: 'Incomplete / Unclear Image',
        observations: 'Unable to detect legible BIS standard marks. Please upload a sharper image.',
        recommendedAction: 'Retake photo under good lighting focusing directly on the ISI logo and CM/L number.',
      };
    }

    parsedScan.disclaimer = 'Visual AI label analysis is for preliminary screening only. Always verify licenses on the official BIS portal (manakonline.in).';

    res.json(parsedScan);
  } catch (err: any) {
    console.error('Label scan error:', err);
    res.status(500).json({ error: 'Image analysis could not be completed. Please ensure image size is under 10MB.' });
  }
});

// 9. Feedback endpoints
app.post('/api/feedback', (req: Request, res: Response) => {
  const { messageId, rating, comment, queryText } = req.body;

  if (!messageId || !rating || (rating !== 'up' && rating !== 'down')) {
    return res.status(400).json({ error: 'Valid messageId and rating ("up" | "down") are required.' });
  }

  const saved = db.addFeedback({ messageId, rating, comment, queryText });
  res.json({ ok: true, id: saved.id });
});

// Chat sessions endpoints (history persistence)
app.get('/api/sessions', (_req: Request, res: Response) => {
  res.json({ sessions: db.listSessions() });
});

app.get('/api/sessions/:id', (req: Request, res: Response) => {
  const session = db.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ session });
});

app.delete('/api/sessions/:id', (req: Request, res: Response) => {
  db.clearSession(req.params.id);
  res.json({ ok: true });
});

// 10. Admin Stats (Protected by x-admin-key)
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const userAdminKey = req.headers['x-admin-key'];

  if (!userAdminKey || userAdminKey !== ADMIN_KEY) {
    return res.status(401).json({
      error: 'Unauthorized. Invalid or missing x-admin-key header.',
    });
  }

  const stats = db.getStats();
  res.json(stats);
});

// ---------------- GLOBAL ERROR HANDLER ----------------
// Never leak stack traces to the client
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[BIS Sahayak Server Error]:', err?.message || err);
  const status = err.status || err.statusCode || 500;
  const message =
    err.message && !err.message.includes('at ')
      ? err.message
      : 'An unexpected internal error occurred. Please try again.';

  res.status(status).json({
    error: message,
  });
});

// ---------------- SERVER & VITE INTEGRATION ----------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // In development, mount Vite as middleware so one command serves both on port 3000
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[BIS Sahayak] Vite mounted in middleware mode (Development)');
  } else {
    // In production, serve dist/
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[BIS Sahayak] Serving static build from dist/ (Production)');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BIS Sahayak] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
