/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Table, Search, Calendar, Trash2, Eye, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { ScanRecord } from "../types";

interface HistoryProps {
  scans: ScanRecord[];
  onSelectScan: (scan: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
}

export default function History({ scans, onSelectScan, onDeleteScan }: HistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredScans = scans.filter((scan) => {
    const searchString = `${scan.company} ${scan.prediction} ${scan.offerText}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div id="history-container" className="border border-slate-200/80 rounded-2xl bg-white shadow-md shadow-slate-100 overflow-hidden">
      {/* Search Header */}
      <div id="history-header" className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50">
        <div className="flex items-center space-x-2.5">
          <Table className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-display font-extrabold text-slate-800 uppercase tracking-wider">
            Verification History Log (SQLite Records)
          </h3>
        </div>
        
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by company, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400 text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Scans Table List */}
      {filteredScans.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] tracking-widest border-b border-slate-200/80">
              <tr>
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Company / Role</th>
                <th className="py-4 px-5">Salary Offer</th>
                <th className="py-4 px-5">Threat Level</th>
                <th className="py-4 px-5">Decision</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {filteredScans.map((scan) => {
                const isFraud = scan.prediction === "Fraud";
                const isSuspicious = scan.prediction === "Suspicious";

                let statusBadge = (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                    <span>Genuine</span>
                  </span>
                );

                if (isFraud) {
                  statusBadge = (
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                      <span>Scam</span>
                    </span>
                  );
                } else if (isSuspicious) {
                  statusBadge = (
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                      <span>Suspicious</span>
                    </span>
                  );
                }

                return (
                  <tr key={scan.id} className="hover:bg-slate-50/70 transition-colors duration-150">
                    <td className="py-4 px-5 whitespace-nowrap text-slate-500 font-medium font-mono">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(scan.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 max-w-[200px]">
                      <span className="text-sm font-display font-bold text-slate-800 block truncate">{scan.company || "Unknown Company"}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-1 truncate">
                        {scan.offerText.slice(0, 45)}...
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-800">{scan.salary || "Not Specified"}</td>
                    <td className="py-4 px-5 font-bold">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${isFraud ? "bg-rose-500" : isSuspicious ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${scan.riskScore}%` }}
                          />
                        </div>
                        <span className="text-slate-500 font-mono text-[10px]">{scan.riskScore}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-5">{statusBadge}</td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onSelectScan(scan)}
                          title="Load scorecard"
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors duration-150"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteScan(scan.id)}
                          title="Delete record"
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-rose-500 hover:bg-rose-50 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors duration-150"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 font-medium font-mono">
          No job offer scans found matching filters in verification logs.
        </div>
      )}
    </div>
  );
}
