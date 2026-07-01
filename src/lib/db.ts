/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";

export interface ScanRecord {
  id: string;
  offerText: string;
  prediction: "Genuine" | "Fraud" | "Suspicious";
  riskScore: number;
  geminiExplanation: string;
  timestamp: string;
  company: string;
  salary: string;
  report: string; // JSON serialized string of detailed verification details
}

class SQLiteFileDatabase {
  private filePath: string;
  private records: ScanRecord[] = [];

  constructor() {
    // Save to database directory as specified in project structure
    const dbDir = path.join(process.cwd(), "database");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.filePath = path.join(dbDir, "scams_database.json");
    this.loadRecords();
  }

  private loadRecords(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, "utf-8");
        this.records = JSON.parse(fileContent);
      } else {
        // Seed with some professional historic scans to populate the dashboard instantly!
        this.records = [
          {
            id: "scan_1",
            offerText: "Dear applicant, you are selected as a virtual typist. Pay $35 registration fee first via gift cards.",
            prediction: "Fraud",
            riskScore: 92,
            geminiExplanation: "Suspicious salary claim coupled with an upfront software license registration fee to be paid via Apple gift cards. Immediate hiring without a formal interview process.",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            company: "Apex Typists Ltd",
            salary: "$4,500/week",
            report: JSON.stringify({
              indicators: {
                asksPayment: true,
                suspiciousEmail: true,
                urgencyLanguage: true,
                unrealisticSalary: true
              },
              emailDomain: "gmail.com",
              websiteTrustScore: 10
            })
          },
          {
            id: "scan_2",
            offerText: "We are pleased to offer you the position of Software Engineer Intern at Stripe. Starting salary is $25 per hour.",
            prediction: "Genuine",
            riskScore: 12,
            geminiExplanation: "Verification confirms this is a genuine internship offer from a verified company domain, featuring realistic student wages, formal recruitment workflow, and no payment requirements.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            company: "Stripe",
            salary: "$25/hour",
            report: JSON.stringify({
              indicators: {
                asksPayment: false,
                suspiciousEmail: false,
                urgencyLanguage: false,
                unrealisticSalary: false
              },
              emailDomain: "stripe.com",
              websiteTrustScore: 98
            })
          },
          {
            id: "scan_3",
            offerText: "Urgent package handler hiring! Earn $1,500 per week. Pay $15 refundable postal insurance deposit now.",
            prediction: "Fraud",
            riskScore: 84,
            geminiExplanation: "Package handler reshipping scam. Requires an upfront refundable deposit for postal insurance and is associated with high urgency keywords.",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            company: "Global Logistics Reship Corp",
            salary: "$1,500/week",
            report: JSON.stringify({
              indicators: {
                asksPayment: true,
                suspiciousEmail: true,
                urgencyLanguage: true,
                unrealisticSalary: false
              },
              emailDomain: "yahoo.com",
              websiteTrustScore: 15
            })
          }
        ];
        this.saveRecords();
      }
    } catch (e) {
      console.error("Error loading database records:", e);
      this.records = [];
    }
  }

  private saveRecords(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.records, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing to database:", e);
    }
  }

  public insert(record: Omit<ScanRecord, "id" | "timestamp">): ScanRecord {
    const newRecord: ScanRecord = {
      ...record,
      id: "scan_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString()
    };
    this.records.unshift(newRecord); // Prepend so most recent is first
    this.saveRecords();
    return newRecord;
  }

  public getAll(): ScanRecord[] {
    return this.records;
  }

  public getById(id: string): ScanRecord | undefined {
    return this.records.find((r) => r.id === id);
  }

  public delete(id: string): boolean {
    const idx = this.records.findIndex((r) => r.id === id);
    if (idx !== -1) {
      this.records.splice(idx, 1);
      this.saveRecords();
      return true;
    }
    return false;
  }

  public clear(): void {
    this.records = [];
    this.saveRecords();
  }

  // Database Analytics Queries for Dashboard
  public getAnalytics() {
    const totalScans = this.records.length;
    if (totalScans === 0) {
      return {
        avgRiskScore: 0,
        fraudCount: 0,
        genuineCount: 0,
        indicatorCounts: {
          asksPayment: 0,
          suspiciousEmail: 0,
          urgencyLanguage: 0,
          unrealisticSalary: 0
        },
        riskDistribution: [
          { name: "Green (0-25)", count: 0 },
          { name: "Yellow (26-50)", count: 0 },
          { name: "Orange (51-75)", count: 0 },
          { name: "Red (76-100)", count: 0 }
        ],
        topSuspiciousDomains: []
      };
    }

    let totalRisk = 0;
    let fraudCount = 0;
    let genuineCount = 0;
    
    const indicatorCounts = {
      asksPayment: 0,
      suspiciousEmail: 0,
      urgencyLanguage: 0,
      unrealisticSalary: 0
    };

    const riskGroups = { green: 0, yellow: 0, orange: 0, red: 0 };
    const domainMap: Record<string, number> = {};

    this.records.forEach((r) => {
      totalRisk += r.riskScore;
      if (r.riskScore > 50) fraudCount++;
      else genuineCount++;

      // Distribute risk categories
      if (r.riskScore <= 25) riskGroups.green++;
      else if (r.riskScore <= 50) riskGroups.yellow++;
      else if (r.riskScore <= 75) riskGroups.orange++;
      else riskGroups.red++;

      // Parse indicators from report JSON
      try {
        const reportObj = JSON.parse(r.report);
        const inds = reportObj.indicators;
        if (inds) {
          if (inds.asksPayment) indicatorCounts.asksPayment++;
          if (inds.suspiciousEmail) indicatorCounts.suspiciousEmail++;
          if (inds.urgencyLanguage) indicatorCounts.urgencyLanguage++;
          if (inds.unrealisticSalary) indicatorCounts.unrealisticSalary++;
        }

        const domain = reportObj.emailDomain || "Unknown";
        if (domain && domain !== "Unknown" && r.riskScore > 50) {
          domainMap[domain] = (domainMap[domain] || 0) + 1;
        }
      } catch (e) {
        // Fallback checks
        if (r.offerText.toLowerCase().includes("pay") || r.offerText.toLowerCase().includes("fee")) {
          indicatorCounts.asksPayment++;
        }
      }
    });

    const topSuspiciousDomains = Object.entries(domainMap)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      avgRiskScore: Math.round(totalRisk / totalScans),
      fraudCount,
      genuineCount,
      indicatorCounts,
      riskDistribution: [
        { name: "Green (0-25)", count: riskGroups.green },
        { name: "Yellow (26-50)", count: riskGroups.yellow },
        { name: "Orange (51-75)", count: riskGroups.orange },
        { name: "Red (76-100)", count: riskGroups.red }
      ],
      topSuspiciousDomains
    };
  }
}

export const db = new SQLiteFileDatabase();
export default db;
