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
    // Save directly to the project root directory so the file is easily visible in the sidebar/folder explorer
    this.filePath = path.join(process.cwd(), "dataset.json");
    this.loadRecords();
  }

  private loadRecords(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, "utf-8");
        this.records = JSON.parse(fileContent);
      }
      
      // Seed with 115 records if the database is missing or has fewer than 100 records
      if (this.records.length < 100) {
        this.seedOneHundredRecords();
      }
    } catch (e) {
      console.error("Error loading database records:", e);
      this.records = [];
      this.seedOneHundredRecords();
    }
  }

  private seedOneHundredRecords(): void {
    const records: ScanRecord[] = [];
    
    const templates = [
      // --- Fraud (10 items) ---
      {
        company: "Quantum Tech Solutions",
        role: "Remote Administrative Assistant",
        salary: "$110/hour",
        prediction: "Fraud" as const,
        riskScore: 94,
        offerText: "URGENT HIRING! Quantum Tech Solutions is hiring remote administrative assistants immediately. Earn $110 per hour. No previous experience or resume required. Interviews are conducted exclusively through Telegram. Before joining, applicants must pay a $50 onboarding verification fee through gift cards or cryptocurrency. This amount will be refunded after training. Apply within the next 24 hours to reserve your position.",
        explanation: "CRITICAL RISK: Direct upfront payment request of $50 via gift cards/cryptocurrency for onboarding verification is a classic signature of employment scams. Interviews are conducted exclusively through Telegram messenger with no formal/secure vetting, and the hourly rate of $110 is highly unrealistic for an entry-level administrative role.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "Telegram/WhatsApp chat onboarding", "High urgency and pressure tactics", "Unrealistic salary scale"],
        emailDomain: "quantumtech-jobs.com"
      },
      {
        company: "Nova Digital Services",
        role: "Work-From-Home Customer Support Executive",
        salary: "$95/hour",
        prediction: "Fraud" as const,
        riskScore: 88,
        offerText: "LIMITED VACANCIES! Nova Digital Services is recruiting work-from-home customer support executives. Earn $95 per hour with flexible hours. No interview or qualifications required. Selected candidates must first pay a $60 document verification charge through wire transfer. Immediate joining available. Hurry, positions close today!",
        explanation: "CRITICAL RISK: Nova Digital Services demands a $60 document verification charge paid via wire transfer before onboarding. The offer requires 'no interview or qualifications' and promises $95/hour for flexible customer support, which violates normal hiring procedures and presents severe indicators of recruitment fraud.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "No formal interview process", "Urgency pressure tactics", "Unrealistic salary scale"],
        emailDomain: "novadigital-careers.com"
      },
      {
        company: "BrightWave Solutions",
        role: "Remote HR Assistant",
        salary: "$7,500/month",
        prediction: "Fraud" as const,
        riskScore: 91,
        offerText: "CONGRATULATIONS! BrightWave Solutions has shortlisted you for a remote HR assistant role. Salary starts at $7,500 per month with guaranteed promotion after one month. Interviews are conducted only through WhatsApp messages. Candidates must submit a refundable $75 training security deposit before receiving the appointment letter.",
        explanation: "CRITICAL RISK: BrightWave Solutions asks for a $75 refundable training security deposit before delivering the official appointment letter. Standard companies do not require applicants to pay to receive employment offers. Additionally, relying solely on WhatsApp text messages for recruitment is highly suspicious.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "Telegram/WhatsApp chat onboarding", "Unrealistic salary scale"],
        emailDomain: "brightwave-hr.com"
      },
      {
        company: "Zenith Global Careers",
        role: "Online Office Assistant",
        salary: "$100/hour",
        prediction: "Fraud" as const,
        riskScore: 95,
        offerText: "Immediate Hiring! Zenith Global Careers is looking for online office assistants. Earn up to $100 per hour without experience. No resume or interview required. Applicants must purchase a company software activation key worth $55 before joining. Payment accepted through gift cards only. Offer expires within 12 hours.",
        explanation: "CRITICAL RISK: Demand to purchase an upfront company software activation key worth $55 using only gift cards is a definitive indicator of an active scam. Real companies provision software licenses at zero cost to employees. Immediate urgency pressure and 'no resume or interview' standard confirm fraudulent intent.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "No formal interview process", "Urgency pressure tactics", "Unrealistic salary scale"],
        emailDomain: "zenithglobal-recruiting.com"
      },
      {
        company: "Prime Vision Technologies",
        role: "Remote Data Processor",
        salary: "$9,000/month",
        prediction: "Fraud" as const,
        riskScore: 86,
        offerText: "Exclusive Opportunity! Prime Vision Technologies is hiring remote data processors. Monthly salary starts at $9,000 with weekly bonuses. Selection takes place through Telegram chat only. A refundable registration fee of $40 must be transferred before training materials are shared. Limited seats available.",
        explanation: "CRITICAL RISK: High-risk indicators include the requirement to pay an upfront $40 registration fee before training materials can be accessed. Official hires are never charged registration or onboarding fees. The Telegram-only interview and extremely high compensation ($9,000/month) further corroborate the scam rating.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "Telegram/WhatsApp chat onboarding", "Unrealistic salary scale"],
        emailDomain: "primevisiontech-jobs.com"
      },
      {
        company: "FastTrack Careers",
        role: "Virtual Assistant",
        salary: "$6,500/month",
        prediction: "Fraud" as const,
        riskScore: 93,
        offerText: "FastTrack Careers is urgently recruiting virtual assistants. Earn $6,500 monthly from home. No educational qualifications required. Interview will be completed over Signal Messenger. Applicants must pay a $70 background verification fee through cryptocurrency before receiving login credentials.",
        explanation: "CRITICAL RISK: Requirement of an upfront $70 background verification fee paid using cryptocurrency (which is completely non-reversible) is a prominent indicator of an employment scam. Genuine agencies cover background verification costs or utilize secure official portals, rather than requiring digital token transfers via Signal.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "Cryptocurrency payment requested", "Signal/Telegram onboarding"],
        emailDomain: "fasttrackcareers-support.com"
      },
      {
        company: "Infinity Business Group",
        role: "Online Administrative Position",
        salary: "$115/hour",
        prediction: "Fraud" as const,
        riskScore: 89,
        offerText: "Remote Hiring Alert! Infinity Business Group is offering online administrative positions with an hourly rate of $115. Candidates are selected instantly after filling a short form. Before employment begins, a refundable $65 laptop insurance deposit is required. Payment should be completed within 24 hours.",
        explanation: "CRITICAL RISK: Demanding a $65 laptop insurance deposit before employment begins is a severe financial hazard. Real employers insure and provide standard laptop workstations at their own expense. The instant hiring process and extreme compensation rate confirm high risk.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "No formal interview process", "Urgency pressure tactics", "Unrealistic salary scale"],
        emailDomain: "infinitybusiness-careers.net"
      },
      {
        company: "DreamWorks Consultancy",
        role: "Remote Executive",
        salary: "$8,500/month",
        prediction: "Fraud" as const,
        riskScore: 92,
        offerText: "DreamWorks Consultancy invites freshers for remote executive positions paying $8,500 per month. No experience needed. Interviews happen only via Telegram text messages. Candidates must purchase a company ID card package costing $80 before the final offer letter is released.",
        explanation: "CRITICAL RISK: The requirement to pay an upfront fee of $80 for a company ID card package prior to receiving an official offer letter represents a financial extraction scheme. Genuine corporate entities provide standard ID credentials completely free of charge upon official hire.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "Telegram/WhatsApp chat onboarding", "Unrealistic salary scale"],
        emailDomain: "dreamworksconsulting-careers.org"
      },
      {
        company: "Elite Career Network",
        role: "Online Project Coordinator",
        salary: "$105/hour",
        prediction: "Fraud" as const,
        riskScore: 90,
        offerText: "Elite Career Network is hiring online project coordinators immediately. Earn $105 per hour while working from home. No resume or degree required. Applicants must transfer a refundable $45 account activation fee through Western Union before beginning work. Join within the next 24 hours.",
        explanation: "CRITICAL RISK: Demanding an upfront $45 account activation fee through Western Union is highly fraudulent. Real hiring networks never request Western Union money transfers as a condition of employment. The 'no resume or degree' clause is designed to entice immediate signups.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "Western Union payment requested", "Urgency pressure tactics", "Unrealistic salary scale"],
        emailDomain: "elitecareernetwork-staffing.com"
      },
      {
        company: "Future Link Services",
        role: "Remote Assistant Job",
        salary: "$10,000/month",
        prediction: "Fraud" as const,
        riskScore: 96,
        offerText: "Future Link Services is offering remote assistant jobs with guaranteed income of $10,000 per month. Selection is completed through WhatsApp chat only. Before joining, candidates are required to pay a refundable $90 training material fee via cryptocurrency. Positions are filling quickly, apply today.",
        explanation: "CRITICAL RISK: A guaranteed salary of $10,000/month for basic assistant work is highly unrealistic. Demanding a $90 training material fee paid in cryptocurrency constitutes a major warning indicator. Genuine corporate training programs are fully covered by employers.",
        indicators: { asksPayment: true, suspiciousEmail: true, urgencyLanguage: true, unrealisticSalary: true },
        scamIndicators: ["Upfront payment requested", "Cryptocurrency payment requested", "Telegram/WhatsApp chat onboarding", "Unrealistic salary scale"],
        emailDomain: "futurelinkservices-jobs.com"
      },

      // --- Genuine (10 items) ---
      {
        company: "Microsoft Corporation",
        role: "Software Engineering Intern",
        salary: "$28/hour",
        prediction: "Genuine" as const,
        riskScore: 8,
        offerText: "Software Engineering Internship at Microsoft Corporation. Join our cloud engineering team for a paid summer internship ($28/hour). Standard qualifications include experience in Python, Java, Git, and SQL databases. The candidate selection process consists of an online coding assessment followed by technical and behavioral interviews conducted over Microsoft Teams. No registration fee, training charge, or payment is required from candidates at any stage.",
        explanation: "GENUINE SIGNALS: Highly professional corporate interview loop including online technical assessments and Microsoft Teams panel chats. Standard, realistic wages are offered for a highly technical student role, and the document explicitly guarantees no payments or fees are requested from applicants at any stage.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "microsoft.com"
      },
      {
        company: "Google LLC",
        role: "Software Development Intern",
        salary: "$30/hour",
        prediction: "Genuine" as const,
        riskScore: 5,
        offerText: "Software Development Internship at Google LLC. Join our engineering team for a paid internship ($30/hour). Candidates should have knowledge of Data Structures, Algorithms, Java, and Python. The hiring process includes an online assessment followed by multiple video interviews with senior software engineers using Google Meet. No upfront payment or registration fee is required.",
        explanation: "GENUINE SIGNALS: Verified corporate internship workflow involving structured algorithmic assessments and standard engineering panel video calls. The document explicitly clarifies that no upfront registrations or financial transactions are needed to apply or join.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "google.com"
      },
      {
        company: "Amazon",
        role: "Backend Engineering Intern",
        salary: "$29/hour",
        prediction: "Genuine" as const,
        riskScore: 10,
        offerText: "Backend Engineering Internship at Amazon. Work with distributed systems and cloud technologies while earning $29/hour. Preferred qualifications include Java, Spring Boot, REST APIs, and AWS fundamentals. Selection consists of coding assessments and virtual interviews with engineering managers. No training fee or security deposit is required.",
        explanation: "GENUINE SIGNALS: The recruitment sequence follows standard patterns with multi-step coding assessments and virtual engineering team interviews. All required toolsets are provided by Amazon, and no candidate training fees or security deposits are requested.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "amazon.com"
      },
      {
        company: "Adobe",
        role: "Software Engineering Intern",
        salary: "$27/hour",
        prediction: "Genuine" as const,
        riskScore: 7,
        offerText: "Software Engineering Internship at Adobe. Join our creative cloud platform team with a paid internship of $27/hour. Applicants should have experience with C++, JavaScript, and object-oriented programming. The recruitment process includes coding challenges and technical interviews conducted through Adobe Connect. No payment is requested from applicants.",
        explanation: "GENUINE SIGNALS: Valid hiring process through Adobe's verified talent acquisition teams. Standard screening tests, video evaluations, and zero-fee policies align perfectly with authentic industry-standard recruiting guidelines.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "adobe.com"
      },
      {
        company: "IBM",
        role: "Data Engineering Intern",
        salary: "$26/hour",
        prediction: "Genuine" as const,
        riskScore: 9,
        offerText: "Data Engineering Internship at IBM. Participate in enterprise AI and analytics projects while earning $26/hour. Candidates should have knowledge of Python, SQL, and data processing concepts. The selection process includes aptitude tests and technical interviews conducted via Zoom. No registration fee or onboarding payment is required.",
        explanation: "GENUINE SIGNALS: Consistent, professional corporate guidelines outlining a formal video interview structure via Zoom. The salary corresponds directly with national average rates for technology trainees, and candidates have no financial exposure.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "ibm.com"
      },
      {
        company: "Salesforce",
        role: "Full Stack Development Intern",
        salary: "$28/hour",
        prediction: "Genuine" as const,
        riskScore: 6,
        offerText: "Full Stack Development Internship at Salesforce. Work on CRM platform development with compensation of $28/hour. Required skills include Java, JavaScript, React, and REST APIs. Candidates complete coding assessments followed by structured interviews with senior engineers over video conferencing. No payment or training charge is required.",
        explanation: "GENUINE SIGNALS: Formal technical internship posting with standard recruitment practices. Transparent evaluations, remote conferencing interfaces, and explicitly stated zero-fee policies confirm an authentic corporate offer.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "salesforce.com"
      },
      {
        company: "Oracle",
        role: "Software Engineering Intern",
        salary: "$27/hour",
        prediction: "Genuine" as const,
        riskScore: 11,
        offerText: "Software Engineering Internship at Oracle. Join our database systems team for a paid internship ($27/hour). Applicants should have experience in Java, SQL, and software development fundamentals. The hiring process consists of coding evaluations and technical interviews with Oracle engineers. Candidates are never asked to pay any registration or training fees.",
        explanation: "GENUINE SIGNALS: Legitimate employment offer containing logical job prerequisites and formal interview stages. Explicit reassurances of zero applicant fees reinforce security and compliance.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "oracle.com"
      },
      {
        company: "Intel Corporation",
        role: "Frontend Development Intern",
        salary: "$25/hour",
        prediction: "Genuine" as const,
        riskScore: 8,
        offerText: "Frontend Development Internship at Intel Corporation. Earn $25/hour while contributing to user interface development. Required skills include HTML, CSS, JavaScript, and React. Candidates complete technical assessments followed by video interviews with the development team. No upfront payments are requested during the recruitment process.",
        explanation: "GENUINE SIGNALS: Appropriate candidate evaluation with standard frontend technology benchmarks. No financial or equipment purchases are requested, adhering perfectly to safe hiring benchmarks.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "intel.com"
      },
      {
        company: "Cisco Systems",
        role: "Software Engineering Intern",
        salary: "$27/hour",
        prediction: "Genuine" as const,
        riskScore: 9,
        offerText: "Software Engineering Internship at Cisco Systems. Join our networking software division with a paid internship offering $27/hour. Preferred qualifications include Python, Networking Basics, and Linux. The recruitment process involves coding assessments and panel interviews conducted via Webex. No application fee or onboarding payment is required.",
        explanation: "GENUINE SIGNALS: Verified hiring tracks utilizing company Webex lines, objective professional qualification requests, and zero-risk onboarding protocols, denoting an authentic Cisco Systems internship.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "cisco.com"
      },
      {
        company: "NVIDIA",
        role: "Software Engineering Intern",
        salary: "$31/hour",
        prediction: "Genuine" as const,
        riskScore: 4,
        offerText: "Software Engineering Internship at NVIDIA. Work on GPU software and AI applications while earning $31/hour. Candidates should have knowledge of C++, Python, and machine learning fundamentals. The selection process includes technical coding interviews and discussions with engineering teams through secure video conferencing. No registration, documentation, or training fees are required at any point.",
        explanation: "GENUINE SIGNALS: Strong industry alignment with secure, authenticated video calls and multi-stage programming interviews. No financial transactions or training product purchases are requested of applicants.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: [],
        emailDomain: "nvidia.com"
      },

      // --- Suspicious (10 items) ---
      {
        company: "Vertex Digital Solutions",
        role: "Marketing Associate Intern",
        salary: "$22/hour",
        prediction: "Suspicious" as const,
        riskScore: 45,
        offerText: "Marketing Associate Internship at Vertex Digital Solutions. Work remotely with flexible hours and earn $22/hour. Candidates should have basic communication skills and familiarity with social media platforms. The selection process includes an online interview through Google Meet. Shortlisted applicants are encouraged to purchase optional training materials for $30 before onboarding, though it is stated to be voluntary.",
        explanation: "SUSPICIOUS SIGNALS: Although advertised as 'voluntary,' recommending candidates buy proprietary training materials for $30 before onboarding is highly abnormal. Genuine firms provide all training resources free of charge. This suggests a potential upselling or low-level recruitment scheme.",
        indicators: { asksPayment: true, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: ["Proprietary training purchase recommended", "Low recruitment barriers"],
        emailDomain: "vertexdigital-careers.net"
      },
      {
        company: "Horizon Business Services",
        role: "Customer Support Executive",
        salary: "$4,000/month",
        prediction: "Suspicious" as const,
        riskScore: 38,
        offerText: "Customer Support Executive at Horizon Business Services. Join our remote support team with a salary of $4,000 per month. Interviews are conducted through Microsoft Teams. Candidates may be asked to purchase a company headset from an approved vendor before their first working day. No registration fee is required.",
        explanation: "SUSPICIOUS SIGNALS: Requiring candidates to purchase equipment (such as a headset) from a specific 'approved vendor' is a common affiliate-marketing or reseller scam hook. While Microsoft Teams is a legitimate medium, this purchasing stipulation introduces medium-level risk.",
        indicators: { asksPayment: true, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: ["Approved equipment vendor purchase requested"],
        emailDomain: "horizonbusiness-hr.com"
      },
      {
        company: "CodeSpark Technologies",
        role: "Software Development Intern",
        salary: "$24/hour",
        prediction: "Suspicious" as const,
        riskScore: 32,
        offerText: "Software Development Internship at CodeSpark Technologies. Paid internship offering $24/hour. Applicants should have experience with Python and Git. The recruitment process includes an online coding assessment followed by a Zoom interview. Due to limited seats, candidates are requested to confirm their participation within 24 hours after receiving the offer.",
        explanation: "SUSPICIOUS SIGNALS: Re-leasing the offer under strict time pressure ('confirm participation within 24 hours due to limited seats') is an artificial urgency tactic. Although the compensation and interview platforms look normal, candidates should exercise caution and double-check credentials.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: true, unrealisticSalary: false },
        scamIndicators: ["Urgency pressure tactics"],
        emailDomain: "codesparktechnologies-recruiting.com"
      },
      {
        company: "Insight Analytics Pvt. Ltd.",
        role: "Remote Data Analyst Intern",
        salary: "$23/hour",
        prediction: "Suspicious" as const,
        riskScore: 40,
        offerText: "Remote Data Analyst Internship at Insight Analytics Pvt. Ltd. Earn $23/hour while working on business intelligence projects. Applicants should know Excel, SQL, and Power BI. Interviews are conducted online. Candidates are advised to complete an optional certification course before joining to improve onboarding efficiency.",
        explanation: "SUSPICIOUS SIGNALS: Suggesting a proprietary certification course before joining raises commercial concerns. This is frequently used to drive sign-ups to third-party paid academic sites rather than evaluating true job qualifications.",
        indicators: { asksPayment: true, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: ["Proprietary training purchase recommended"],
        emailDomain: "insightanalytics-jobs.org"
      },
      {
        company: "NextGen Systems",
        role: "Junior Software Engineer",
        salary: "$5,200/month",
        prediction: "Suspicious" as const,
        riskScore: 35,
        offerText: "Junior Software Engineer at NextGen Systems. Compensation starts at $5,200 per month. The hiring process consists of an online aptitude test followed by a video interview. Candidates are requested to submit scanned identity documents before the final offer letter is issued. No payment is required.",
        explanation: "SUSPICIOUS SIGNALS: Soliciting scanned national identity documents before releasing a formal offer letter can be a phishing vector for identity theft. Standard procedure holds document verification until after an offer has been signed by both parties.",
        indicators: { asksPayment: false, suspiciousEmail: true, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: ["Premature identity document submission requested"],
        emailDomain: "nextgensystems-careers.com"
      },
      {
        company: "Bright Ideas Media",
        role: "Content Writer Intern",
        salary: "$20/hour",
        prediction: "Suspicious" as const,
        riskScore: 42,
        offerText: "Content Writer Internship at Bright Ideas Media. Work remotely with a stipend of $20/hour. Interviews are conducted through Google Meet. Selected candidates are encouraged to purchase a branded welcome kit costing $25, which will be delivered before joining. The purchase is optional.",
        explanation: "SUSPICIOUS SIGNALS: Recommending candidates buy a branded welcome kit for $25, even if labeled 'optional,' is a suspicious commercial practice. Genuine employers supply standard swag or welcome materials completely free.",
        indicators: { asksPayment: true, suspiciousEmail: false, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: ["Proprietary training purchase recommended"],
        emailDomain: "brightideasmedia-talent.net"
      },
      {
        company: "BluePeak Technologies",
        role: "Technical Support Intern",
        salary: "$21/hour",
        prediction: "Suspicious" as const,
        riskScore: 34,
        offerText: "Technical Support Internship at BluePeak Technologies. Paid internship with compensation of $21/hour. Applicants should have basic networking knowledge. Interviews take place through Zoom. Due to project confidentiality, candidates must sign a digital NDA before receiving project details. Limited positions are available.",
        explanation: "SUSPICIOUS SIGNALS: Restricting standard company insights behind a pre-interview NDA is non-standard. Combined with 'limited positions' scarcity marketing, this approach suggests artificial urgency designed to rush applicants.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: true, unrealisticSalary: false },
        scamIndicators: ["Urgency pressure tactics", "Non-standard NDA sequence"],
        emailDomain: "bluepeaktechnologies-careers.com"
      },
      {
        company: "Elevate Consulting",
        role: "Business Operations Intern",
        salary: "$24/hour",
        prediction: "Suspicious" as const,
        riskScore: 36,
        offerText: "Business Operations Intern at Elevate Consulting. Earn $24/hour while supporting business operations remotely. Candidates complete an online interview and aptitude assessment. Applicants are requested to verify their identity using a third-party verification service before onboarding. No direct payment is requested by the company.",
        explanation: "SUSPICIOUS SIGNALS: Utilizing unfamiliar, unverified third-party identity verification apps introduces personal data leakage risks. Real consulting firms use industry-standard platforms (such as Workday or DocuSign) for compliant background checking.",
        indicators: { asksPayment: false, suspiciousEmail: true, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: ["Premature identity document submission requested"],
        emailDomain: "elevateconsulting-hr.org"
      },
      {
        company: "PixelCraft Studios",
        role: "UI/UX Design Intern",
        salary: "$23/hour",
        prediction: "Suspicious" as const,
        riskScore: 37,
        offerText: "UI/UX Design Internship at PixelCraft Studios. Compensation is $23/hour. Candidates should have experience with Figma and Adobe XD. Interviews are conducted over Microsoft Teams. Due to high application volume, shortlisted candidates are expected to respond within 48 hours to retain their interview slot.",
        explanation: "SUSPICIOUS SIGNALS: While the position description is standard, the aggressive 48-hour response limit for retention of interview slots leverages urgency pressure. Candidates should proceed with moderate vigilance.",
        indicators: { asksPayment: false, suspiciousEmail: false, urgencyLanguage: true, unrealisticSalary: false },
        scamIndicators: ["Urgency pressure tactics"],
        emailDomain: "pixelcraftstudios-recruiting.com"
      },
      {
        company: "LogicWorks Technologies",
        role: "Software Testing Intern",
        salary: "$22/hour",
        prediction: "Suspicious" as const,
        riskScore: 33,
        offerText: "Software Testing Internship at LogicWorks Technologies. Paid internship offering $22/hour. Applicants should understand manual testing and basic automation concepts. The recruitment process includes a technical interview through Google Meet followed by HR discussion. Candidates are asked to install company-approved software before onboarding using an official download link.",
        explanation: "SUSPICIOUS SIGNALS: Demanding installation of proprietary testing packages or unverified applications before starting raises concerns for potential trojans/malware. Software should only be configured inside company-issued machines or sandbox workspaces.",
        indicators: { asksPayment: false, suspiciousEmail: true, urgencyLanguage: false, unrealisticSalary: false },
        scamIndicators: ["Unverified application installation requested"],
        emailDomain: "logicworkstechnologies-support.com"
      }
    ];

    // Multiply templates to build 120 total records staggered historically over the past 60 days
    for (let run = 0; run < 4; run++) {
      templates.forEach((t, tIdx) => {
        // Vary the risk score slightly (+/- up to 3 points, keep within boundaries)
        const variance = Math.floor(Math.random() * 7) - 3;
        let risk = t.riskScore + variance;
        if (risk < 0) risk = 0;
        if (risk > 100) risk = 100;

        // Space out timestamps over the last 60 days
        const daysAgo = run * 14 + (tIdx * 0.4);
        const hoursAgo = Math.floor(Math.random() * 24);
        const timestamp = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000)).toISOString();

        // Vary the email domain based on provider run
        let domain = t.emailDomain || "gmail.com";
        if (run > 0 && t.prediction === "Fraud") {
          const alternativeFreeProviders = ["yahoo.com", "outlook.com", "hotmail.com", "yandex.com", "mail.com"];
          domain = alternativeFreeProviders[(run - 1 + tIdx) % alternativeFreeProviders.length];
        }

        records.push({
          id: `scan_seed_${run}_${tIdx}_${Date.now() + Math.floor(Math.random() * 10000)}`,
          offerText: t.offerText,
          prediction: t.prediction,
          riskScore: risk,
          geminiExplanation: t.explanation,
          timestamp,
          company: t.company,
          salary: t.salary,
          report: JSON.stringify({
            indicators: t.indicators,
            emailDomain: domain,
            emailTrustScore: t.prediction === "Genuine" ? (90 + Math.floor(Math.random() * 10)) : (t.prediction === "Suspicious" ? (35 + Math.floor(Math.random() * 20)) : (5 + Math.floor(Math.random() * 15))),
            websiteTrustScore: t.prediction === "Genuine" ? (88 + Math.floor(Math.random() * 12)) : (t.prediction === "Suspicious" ? (30 + Math.floor(Math.random() * 25)) : (2 + Math.floor(Math.random() * 20))),
            mlModelUsed: "Logistic Regression Classifier",
            mlModelMetrics: { f1: 0.941, accuracy: 0.952, precision: 0.948, recall: 0.935 },
            ruleBasedScore: t.prediction === "Genuine" ? 0 : (t.prediction === "Suspicious" ? 35 : 85),
            cognitiveRiskScore: risk,
            scamIndicators: t.scamIndicators
          })
        });
      });
    }

    // Sort chronologically (newest first)
    this.records = records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    this.saveRecords();
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
