/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { pipeline } from "./src/lib/ml_classifier.js";
import { db } from "./src/lib/db.js";

// Load environment variables
dotenv.config();

const PORT = 3000;
const app = express();

// Set body size limits to support base64 image/PDF uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// --- LAZY GEMINI API CLIENT INITIALIZATION ---
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error(
        "GEMINI_API_KEY environment variable is not configured. Please define it in the Secrets panel in AI Studio settings."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 2. Fetch history of offer scans
app.get("/api/scans", (req, res) => {
  try {
    const scans = db.getAll();
    res.json({ success: true, scans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Delete a scan record
app.delete("/api/scans/:id", (req, res) => {
  try {
    const deleted = db.delete(req.params.id);
    res.json({ success: deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Fetch live system analytics
app.get("/api/analytics", (req, res) => {
  try {
    const analytics = db.getAnalytics();
    res.json({ success: true, analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Extract domain from email or URL
function parseDomain(input: string): string {
  if (!input) return "";
  let clean = input.trim().toLowerCase();
  // If email
  if (clean.includes("@")) {
    return clean.split("@").pop() || "";
  }
  // If URL
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/, "");
  return clean.split("/")[0];
}

// 5. Verify an offer (Hybrid Risk Engine & Cognitive Agent)
app.post("/api/verify", async (req, res) => {
  try {
    const { offerText, fileName, fileBase64, fileMime } = req.body;

    if (!offerText && !fileBase64) {
      return res.status(400).json({
        success: false,
        error: "Either offer text or a file upload (screenshot/PDF) is required."
      });
    }

    let extractedText = offerText || "";
    let base64Part: any = null;

    // A. Multimodal Input Processing (Image / PDF OCR / Text parse)
    if (fileBase64 && fileMime) {
      if (fileMime === "text/plain" || fileMime.startsWith("text/")) {
        try {
          const rawBase64 = fileBase64.split(",").pop() || fileBase64;
          extractedText = Buffer.from(rawBase64, "base64").toString("utf-8").trim();
        } catch (textErr: any) {
          throw new Error("Failed to decode text file: " + textErr.message);
        }
      } else {
        base64Part = {
          inlineData: {
            mimeType: fileMime,
            data: fileBase64.split(",").pop() || fileBase64,
          },
        };

        try {
          const ai = getGeminiClient();
          
          // Use Gemini 3.5 Flash as an advanced cognitive OCR engine
          const ocrResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
              base64Part,
              "Extract ALL visible text from this document or screenshot of a job offer letter, email, or chat conversation. Return only the raw text verbatim, do not add headers, commentary, or summaries."
            ]
          });

          if (ocrResponse.text) {
            extractedText = ocrResponse.text.trim();
          }
        } catch (ocrError: any) {
          console.error("Multimodal OCR extraction failed:", ocrError);
          // Fallback to text if provided, else propagate error
          if (!extractedText) {
            throw new Error("Failed to process document file: " + ocrError.message);
          }
        }
      }
    }

    if (!extractedText) {
      throw new Error("No text content could be extracted or processed from the provided inputs.");
    }

    // B. ML Classifier Model Inference
    // Predicts the probability of being a scam using our pure TS ML classifier trained on FTC guidelines
    const mlResult = pipeline.predict(extractedText);
    const mlScore = Math.round(mlResult.prob * 100);

    // C. Rule-Based Threat Analysis
    const textLower = extractedText.toLowerCase();
    
    // Heuristic 1: Payment requests & fees (Upfront charges)
    const indicators = {
      asksPayment: false,
      suspiciousEmail: false,
      urgencyLanguage: false,
      unrealisticSalary: false
    };

    const paymentKeywords = [
      "fee", "payment", "deposit", "pay upfront", "registration charge", "buy laptop",
      "gift card", "crypto", "bitcoin", "western union", "wire transfer", "refundable deposit",
      "background check cost", "training kit", "purchase hardware"
    ];
    indicators.asksPayment = paymentKeywords.some((kw) => textLower.includes(kw));

    // Heuristic 2: Suspicious Email domains / Free emails
    const freeEmailProviders = [
      "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "zoho.com",
      "protonmail.com", "mail.com", "yandex.com", "temp-mail", "mailinator"
    ];
    
    // We will extract email domain dynamically using regex
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const foundEmails = extractedText.match(emailRegex) || [];
    let senderEmailDomain = "";
    if (foundEmails.length > 0) {
      senderEmailDomain = parseDomain(foundEmails[0]);
      indicators.suspiciousEmail = freeEmailProviders.some((provider) => senderEmailDomain.includes(provider));
    }

    // Heuristic 3: Urgency and high pressure language
    const urgencyKeywords = [
      "urgent", "immediately", "immediate start", "act fast", "limited slots", "reserve today",
      "within 24 hours", "hiring now", "no interview required", "instantly selected", "quick decision"
    ];
    indicators.urgencyLanguage = urgencyKeywords.some((kw) => textLower.includes(kw));

    // Heuristic 4: Unrealistic Salaries / Instant Wealth
    const salaryRegex = /(?:(\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per hour|hr|weekly|week|monthly|yr|annual|\/hr|\/wk))/gi;
    const foundSalaries = extractedText.match(salaryRegex) || [];
    let unrealisticSalary = false;
    
    // Simple heuristic: if salary is > $100/hour or > $5,000/week or > $200,000/year for general student work
    if (foundSalaries.length > 0) {
      const salaryStr = foundSalaries[0].toLowerCase();
      if (
        (salaryStr.includes("hour") || salaryStr.includes("hr")) && (parseInt(salaryStr.replace(/[^\d]/g, "")) > 80) ||
        (salaryStr.includes("week") || salaryStr.includes("wk")) && (parseInt(salaryStr.replace(/[^\d]/g, "")) > 3000)
      ) {
        unrealisticSalary = true;
      }
    }
    if (textLower.includes("earn $100 per hour") || textLower.includes("$5,000 per week") || textLower.includes("$120 per hour")) {
      unrealisticSalary = true;
    }
    indicators.unrealisticSalary = unrealisticSalary;

    // Calculate heuristic risk percentage (0-100)
    let ruleScore = 0;
    if (indicators.asksPayment) ruleScore += 45;
    if (indicators.suspiciousEmail) ruleScore += 25;
    if (indicators.unrealisticSalary) ruleScore += 20;
    if (indicators.urgencyLanguage) ruleScore += 10;

    // D. Gemini Cognitive Agent Analysis (Entity & Feature Extraction)
    const ai = getGeminiClient();
    let agentDetails: any = null;

    const geminiPrompt = `
You are an expert AI Job Offer Verification Agent. Your task is to analyze the following job offer text and extract structured information, identify compliance risks, and assess fraud characteristics based on the FTC Job Scam guidelines.

Analyze the text and populate this strict JSON schema. Return ONLY valid, parsed JSON.

Job Offer Text:
"""
${extractedText}
"""
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING, description: "Extract the hiring company name or 'Unknown'" },
            jobRole: { type: Type.STRING, description: "Extract the job position / title" },
            salary: { type: Type.STRING, description: "Extract the offered salary, wage or stipend" },
            location: { type: Type.STRING, description: "Extract the location (e.g. Remote, City, Unknown)" },
            companyWebsite: { type: Type.STRING, description: "Extract the company website if listed, otherwise empty string" },
            email: { type: Type.STRING, description: "Extract contact email addresses" },
            phone: { type: Type.STRING, description: "Extract contact phone numbers" },
            interviewMethod: { type: Type.STRING, description: "How is the interview conducted? (e.g. Telegram, WhatsApp, Zoom, Teams, Email, None, etc.)" },
            workMode: { type: Type.STRING, description: "Remote, Hybrid, In-Office, or Unknown" },
            requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Documents requested (SSN, ID, Resume, Credit Card details, etc.)" },
            paymentRequested: { type: Type.BOOLEAN, description: "Does this offer ask the candidate to pay for registration, training, background checks, laptop, or software?" },
            paymentAmount: { type: Type.STRING, description: "The amount requested to pay, if any" },
            scamIndicators: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List specific red flags noticed in the offer (e.g. free email sender, pay upfront, non-standard interview, high urgency, spelling errors)" },
            urgencyLevel: { type: Type.STRING, description: "Urgency level: High, Medium, or Low" },
            cognitiveRiskScore: { type: Type.INTEGER, description: "Your assessed scam risk score from 0 (100% genuine) to 100 (100% fraud)" },
            explanationMarkdown: { type: Type.STRING, description: "A detailed, professional, objective bulleted explanation of why this offer is suspicious or genuine. Map your reasoning to FTC guidance." },
            recommendation: { type: Type.STRING, description: "Actionable concrete recommendation steps for the student (e.g., check official website, do not pay fees, contact official HR via LinkedIn)" }
          },
          required: [
            "companyName", "jobRole", "salary", "location", "companyWebsite", "email",
            "phone", "interviewMethod", "workMode", "requiredDocuments", "paymentRequested",
            "scamIndicators", "urgencyLevel", "cognitiveRiskScore", "explanationMarkdown", "recommendation"
          ]
        }
      }
    });

    try {
      if (response.text) {
        agentDetails = JSON.parse(response.text);
      }
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON schema response, falling back:", parseErr);
      // Fallback details if JSON parsing failed
      agentDetails = {
        companyName: "Extracted Company",
        jobRole: "Extracted Job Role",
        salary: foundSalaries[0] || "Unknown",
        location: "Unknown",
        companyWebsite: "",
        email: foundEmails[0] || "",
        phone: "",
        interviewMethod: "Unknown",
        workMode: "Remote",
        requiredDocuments: [],
        paymentRequested: indicators.asksPayment,
        scamIndicators: Object.entries(indicators)
          .filter(([_, v]) => v)
          .map(([k]) => k),
        urgencyLevel: indicators.urgencyLanguage ? "High" : "Normal",
        cognitiveRiskScore: mlScore,
        explanationMarkdown: "The automated risk analyzer noticed indicators matching FTC job scam warnings, including unusual wages or standard communication structures.",
        recommendation: "Verify with the official website and do not pay any upfront fees."
      };
    }

    // E. HYBRID RISK SCORE CALCULATION
    // Formula balances ML prediction weight, exact rule matches, and LLM logical reasoning score
    const cognitiveRisk = agentDetails.cognitiveRiskScore || 50;
    const finalRiskScore = Math.min(
      100,
      Math.max(0, Math.round(mlScore * 0.3 + ruleScore * 0.3 + cognitiveRisk * 0.4))
    );

    // Color coding mapping
    let riskCategory: "Genuine" | "Suspicious" | "Fraud" = "Genuine";
    let riskColor = "green";
    if (finalRiskScore > 25 && finalRiskScore <= 50) {
      riskCategory = "Suspicious";
      riskColor = "yellow";
    } else if (finalRiskScore > 50) {
      riskCategory = "Fraud";
      riskColor = "red";
    }

    // F. Email & Company Domain Trust Score Checking
    let emailTrustScore = 100;
    let websiteTrustScore = 100;
    const suspiciousKeywordsFound: string[] = [];

    // Analyze domain match
    if (agentDetails.email) {
      const parsedEmailDom = parseDomain(agentDetails.email);
      const parsedWebDom = parseDomain(agentDetails.companyWebsite);

      if (parsedEmailDom) {
        if (freeEmailProviders.some((provider) => parsedEmailDom.includes(provider))) {
          emailTrustScore = 15; // very low trust for free emails
        } else if (parsedWebDom && parsedEmailDom !== parsedWebDom) {
          emailTrustScore = 40; // domain mismatch
        }
      }
    }

    if (agentDetails.companyWebsite) {
      const parsedWebDom = parseDomain(agentDetails.companyWebsite);
      if (parsedWebDom) {
        const suspiciousDomainTlds = [".ru", ".cc", ".biz", ".tk", ".club", ".gq", ".ga", ".cf", ".work"];
        const isSuspiciousTld = suspiciousDomainTlds.some((tld) => parsedWebDom.endsWith(tld));
        if (isSuspiciousTld) {
          websiteTrustScore = 30;
        } else if (finalRiskScore > 60) {
          websiteTrustScore = 50; // lowered if overall risk is high
        }
      } else {
        websiteTrustScore = 0;
      }
    } else {
      websiteTrustScore = 0; // no website
    }

    // G. Store verification in local persistent SQL-equivalent DB
    const completeReport = {
      indicators,
      emailDomain: senderEmailDomain || parseDomain(agentDetails.email) || "None",
      emailTrustScore,
      websiteTrustScore,
      mlModelUsed: mlResult.report.name,
      mlModelMetrics: mlResult.report.metrics,
      ruleBasedScore: ruleScore,
      cognitiveRiskScore: cognitiveRisk,
      scamIndicators: agentDetails.scamIndicators || []
    };

    const savedRecord = db.insert({
      offerText: extractedText,
      prediction: riskCategory,
      riskScore: finalRiskScore,
      geminiExplanation: agentDetails.explanationMarkdown,
      company: agentDetails.companyName,
      salary: agentDetails.salary,
      report: JSON.stringify(completeReport)
    });

    res.json({
      success: true,
      scan: {
        ...savedRecord,
        details: agentDetails,
        indicators,
        emailTrustScore,
        websiteTrustScore,
        color: riskColor,
        mlResult: {
          model: mlResult.model,
          probability: mlResult.prob,
          metrics: mlResult.report.metrics,
          importance: mlResult.report.featureImportance
        }
      }
    });
  } catch (error: any) {
    console.error("Job verification failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Interactive AI Chat Assistant (Referencing scan context if provided)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, scanId, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: "Query message is required." });
    }

    const ai = getGeminiClient();
    let contextPrompt = "You are 'CareerGuard AI', an interactive student career safety coach and professional job-scam advisor. Answer the user's queries concisely, providing actionable and empathetic guidance. Map your advice directly to the FTC job scam parameters.";

    if (scanId) {
      const scan = db.getById(scanId);
      if (scan) {
        let details = null;
        try {
          details = JSON.parse(scan.report);
        } catch (e) {}

        contextPrompt += `
The user is asking questions specifically about a previously scanned job offer. Here is the context of that scan:
- Company Name: ${scan.company}
- Position Role: ${scan.id}
- Offer Text: """${scan.offerText}"""
- Risk Score Assessed: ${scan.riskScore}/100 (Category: ${scan.prediction})
- Fraud Evidence Analysis: ${scan.geminiExplanation}
Please use this scan context to provide accurate, specific, and hyper-relevant answers. Help them understand exactly why this specific offer is suspicious, what standard red flags are present, and how to verify or handle it safely.
`;
      }
    }

    // Assemble conversational history
    const chatHistory = history || [];
    const contents: any[] = [];
    
    // Convert history format if necessary or use chat sessions
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: contextPrompt,
        temperature: 0.7,
      }
    });

    // Feed prior history in sequence
    for (const msg of chatHistory) {
      // Simplistic history injection as system messages or chat history
      await chat.sendMessage({ message: msg.content });
    }

    // Send final message
    const response = await chat.sendMessage({ message });
    
    res.json({
      success: true,
      reply: response.text
    });
  } catch (error: any) {
    console.error("Chat assistant error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// 7. Download sample files for testing upload
app.get("/api/download-sample", (req, res) => {
  const { type } = req.query;
  
  if (type === "scam_txt") {
    res.setHeader("Content-Disposition", "attachment; filename=Apex_Logistics_Scam_Offer.txt");
    res.setHeader("Content-Type", "text/plain");
    const content = `Apex Logistics Corp
Global Distribution & Fulfillment Services

RE: REMOTE DATA ENTRY ASSISTANT - ACCEPTANCE OF EMPLOYMENT

Dear Candidate,

We are pleased to inform you that your application for the Remote Data Entry Assistant position at Apex Logistics Corp has been approved. This is an immediate hiring decision. 

POSITION DETAILS & COMPENSATION:
- Position: Remote Data Entry Assistant
- Compensation: $120.00 per hour
- Hours: Flexible, 15 to 30 hours per week
- Mode: 100% Work from Home

ONBOARDING & TRAINING FEE REQUIRED:
As part of our standard remote worker setup, we require all new hires to register their corporate security profile and purchase required training software. You are required to submit a refundable registration deposit of $45.00 via wire transfer, Western Union, or digital gift cards (Google Play, Apple, or Steam cards are accepted for fast tracking). 

This security deposit is 100% refundable and will be repaid to you on your first weekly check.

INTERVIEW & SELECTION PROCEDURE:
The selection process is conducted strictly over Telegram app chat (handle: @ApexLogisticsHiring). No formal face-to-face video or telephone interview is required. You must contact our recruiter within 24 hours of receiving this letter, otherwise your position will be offered to another candidate.

Welcome to the team!

Sincerely,
Recruitment Board
Apex Logistics Corp
recruitment@apex-logistics-jobs.com`;
    return res.send(content);
  }

  if (type === "genuine_txt") {
    res.setHeader("Content-Disposition", "attachment; filename=Stripe_Genuine_Offer.txt");
    res.setHeader("Content-Type", "text/plain");
    const content = `Stripe Inc.
354 Oyster Point Blvd, South San Francisco, CA 94080

RE: OFFER OF SUMMER SOFTWARE ENGINEERING INTERNSHIP

Dear Candidate,

On behalf of Stripe Inc., we are delighted to offer you a position as a Summer Software Engineering Intern with our Core Payments team. 

POSITION DETAILS & COMPENSATION:
- Position: Software Engineering Intern
- Compensation: $25.00 per hour
- Hours: Full-time (40 hours per week)
- Location: South San Francisco, CA (Hybrid: 3 days in-office, 2 days remote)

ONBOARDING & SELECTION CONFIRMATION:
Your selection is based on your performance in our recent Technical Assessments Challenge and subsequent face-to-face video conferences with our senior engineering leads on Zoom. No fees, registration costs, security deposits, or purchase of hardware/software are required from candidates at any stage of recruitment or employment. All necessary workstations, laptops, and credentials will be shipped directly to your verified address on your start date.

Please review the attached onboarding documents and sign below to accept this offer. We look forward to welcoming you to Stripe.

Sincerely,
University Recruiting Team
Stripe Inc.
recruiting@stripe.com`;
    return res.send(content);
  }

  if (type === "scam_pdf") {
    res.setHeader("Content-Disposition", "attachment; filename=Apex_Logistics_Scam_Offer.pdf");
    res.setHeader("Content-Type", "application/pdf");
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 10 Tf
72 712 Td
(Apex Logistics Corp - Job Offer Letter) Tj
0 -20 Td
(Remote Data Entry Assistant. Earn $120.00 per hour.) Tj
0 -20 Td
(Interview is conducted strictly over Telegram app chat.) Tj
0 -20 Td
(Requirements: Refundable registration deposit of $45.00.) Tj
0 -20 Td
(Payment via wire transfer, Western Union, or digital gift cards.) Tj
0 -20 Td
(Contact our recruiter within 24 hours.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
400
%%EOF`;
    return res.send(Buffer.from(pdfContent, "utf-8"));
  }

  if (type === "genuine_pdf") {
    res.setHeader("Content-Disposition", "attachment; filename=Stripe_Genuine_Offer.pdf");
    res.setHeader("Content-Type", "application/pdf");
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 10 Tf
72 712 Td
(Stripe Inc. - Summer Software Engineering Internship) Tj
0 -20 Td
(Compensation: $25.00 per hour. Hybrid: 3 days in-office, 2 days remote.) Tj
0 -20 Td
(Interview conducted on Zoom after technical assessments challenge.) Tj
0 -20 Td
(No fees, registration costs, or purchase of hardware are required.) Tj
0 -20 Td
(All necessary laptops will be shipped directly to your verified address.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
400
%%EOF`;
    return res.send(Buffer.from(pdfContent, "utf-8"));
  }

  res.status(400).json({ success: false, error: "Invalid sample type requested." });
});


// ============================================================================
// VITE DEV SERVER AND PRODUCTION SERVING BUILD SYSTEM
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode - integrate Vite dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Mount Vite dev server middleware
    app.use(vite.middlewares);
    
    console.log("Vite Development Server mounted successfully.");
  } else {
    // Production mode - serve bundled static assets
    const distPath = path.join(process.cwd(), "dist");
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      
      // SPA Fallback for all routing
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
      console.log("Serving Production static assets from /dist.");
    } else {
      console.warn("WARNING: /dist folder not found. Please run 'npm run build' before starting production server.");
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fake Job Offer Detector Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
