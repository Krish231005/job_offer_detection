/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { Indicators } from "../types";

interface EvidencePanelProps {
  indicators: Indicators;
  emailTrustScore: number;
  websiteTrustScore: number;
  companyName: string;
  interviewMethod: string;
}

export default function EvidencePanel({
  indicators,
  emailTrustScore,
  websiteTrustScore,
  companyName,
  interviewMethod
}: EvidencePanelProps) {
  
  // Format indicators checklist
  const criteria = [
    {
      id: "payment",
      title: "Upfront Payments & Fees",
      desc: "Checking if the recruiter is demanding upfront registration, security checks, software, or training fees.",
      status: indicators.asksPayment ? "fail" : "pass",
      failText: "Upfront fees requested. Legitimate employers never charge candidates.",
      passText: "No financial requests detected. Complies with FTC guidelines."
    },
    {
      id: "email",
      title: "Sender Email Authenticity",
      desc: "Validating whether the recruiter is utilizing high-risk free email accounts (e.g. Gmail, Yahoo) or matching company domains.",
      status: emailTrustScore < 50 ? "fail" : "pass",
      failText: `High-risk address. Recruiter email lacks official company domain (Trust: ${emailTrustScore}%).`,
      passText: `Verified sender. Uses matching domain or formal business SMTP (Trust: ${emailTrustScore}%).`
    },
    {
      id: "website",
      title: "Company Domain Trust",
      desc: "Cross-referencing domain availability, HTTPS protocols, and official company registry availability.",
      status: websiteTrustScore < 50 ? "fail" : "pass",
      failText: `No corporate website or newly created high-risk extension domain (Trust: ${websiteTrustScore}%).`,
      passText: `Corporate website identified. Legitimate corporate registry profile (Trust: ${websiteTrustScore}%).`
    },
    {
      id: "salary",
      title: "Salary Parameter Realism",
      desc: "Detecting highly unrealistic hourly pay rates or weekly commissions designed to bait students.",
      status: indicators.unrealisticSalary ? "fail" : "pass",
      failText: "Highly unrealistic wage claims noticed. Fits classic check-cashing scam profiles.",
      passText: "Compensation falls within standard market parameters for internships."
    },
    {
      id: "urgency",
      title: "Recruitment Urgency Level",
      desc: "Evaluating extreme time pressure tactics, 'no interview required' states, or 'immediate hiring' statements.",
      status: indicators.urgencyLanguage ? "fail" : "pass",
      failText: "High urgency text noticed. Designed to bypass cautious critical checks.",
      passText: "Normal professional timeline with standard screening procedures."
    },
    {
      id: "interview",
      title: "Screening Channel Legitimacy",
      desc: "Flagging chats conducted exclusively on Telegram, WhatsApp, or Signal apps without face-to-face video checks.",
      status: ["telegram", "whatsapp", "signal"].some(x => interviewMethod?.toLowerCase()?.includes(x)) ? "fail" : "pass",
      failText: `Screening done solely on chat app (${interviewMethod}). Legitimate firms require video meetings.`,
      passText: "Traditional screening requested (Teams, Zoom, in-person assessment, or panel interviews)."
    }
  ];

  return (
    <div id="evidence-panel-wrapper" className="p-6 border border-slate-200/80 rounded-2xl bg-white shadow-md shadow-slate-100">
      <div className="flex items-center space-x-2.5 mb-6">
        <Shield className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-display font-extrabold text-slate-800 uppercase tracking-wider">
          Fraud Evidence Tracker
        </h3>
      </div>

      <div id="criteria-items-list" className="space-y-4">
        {criteria.map((item) => {
          const isFail = item.status === "fail";
          return (
            <div
              key={item.id}
              className={`flex items-start space-x-3.5 p-4 border rounded-xl transition-all duration-300 ${
                isFail
                  ? "border-rose-200 bg-rose-50/40 hover:bg-rose-50/70"
                  : "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70"
              }`}
            >
              {/* Status Icons */}
              <div className="mt-0.5 flex-shrink-0">
                {isFail ? (
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
              </div>

              {/* Text Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-display font-bold text-slate-800 tracking-tight">{item.title}</h4>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest ${
                      isFail
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {isFail ? "Red Flag" : "Pass"}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                
                <p
                  className={`text-xs font-bold mt-2.5 ${
                    isFail ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  {isFail ? item.failText : item.passText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
