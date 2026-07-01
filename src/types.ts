/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Indicators {
  asksPayment: boolean;
  suspiciousEmail: boolean;
  urgencyLanguage: boolean;
  unrealisticSalary: boolean;
}

export interface MLMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
}

export interface FeatureImportance {
  word: string;
  importance: number;
}

export interface VerificationDetails {
  companyName: string;
  jobRole: string;
  salary: string;
  location: string;
  companyWebsite: string;
  email: string;
  phone: string;
  interviewMethod: string;
  workMode: string;
  requiredDocuments: string[];
  paymentRequested: boolean;
  paymentAmount: string;
  scamIndicators: string[];
  urgencyLevel: string;
  cognitiveRiskScore: number;
  explanationMarkdown: string;
  recommendation: string;
}

export interface ScanRecord {
  id: string;
  offerText: string;
  prediction: "Genuine" | "Suspicious" | "Fraud";
  riskScore: number;
  geminiExplanation: string;
  timestamp: string;
  company: string;
  salary: string;
  report: string; // JSON string of metrics
}

export interface CompleteScanResponse {
  id: string;
  offerText: string;
  prediction: "Genuine" | "Suspicious" | "Fraud";
  riskScore: number;
  geminiExplanation: string;
  company: string;
  salary: string;
  timestamp: string;
  details: VerificationDetails;
  indicators: Indicators;
  emailTrustScore: number;
  websiteTrustScore: number;
  color: "green" | "yellow" | "red";
  mlResult: {
    model: string;
    probability: number;
    metrics: MLMetrics;
    importance: FeatureImportance[];
  };
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  content: string;
  timestamp: string;
}
