/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, AlertCircle } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatAssistantProps {
  activeScanId?: string;
  activeCompanyName?: string;
}

export default function ChatAssistant({ activeScanId, activeCompanyName }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "bot",
      content: `Hello! I am **CareerGuard AI**, your dedicated student career safety coach. 
      
I can explain FTC job-scam guidelines, verify warning flags, and guide you on verifying recruiters safely.
${
  activeCompanyName
    ? `\n\nI see you recently scanned an offer associated with **${activeCompanyName}**. Feel free to ask me questions like: *'Why is this suspicious?'* or *'What should I ask the recruiter?'*`
    : ""
}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Suggested questions based on context
  const suggestions = activeScanId
    ? [
        "Why was this flagged as high-risk?",
        "What are the FTC rules on upfront fees?",
        "How do I verify the official company website?",
        "What warning signs should I check?"
      ]
    : [
        "What are the most common job scams?",
        "How do I spot a fake check scam?",
        "Are Telegram interviews standard?",
        "What should I do if I paid a scammer?"
      ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      sender: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          scanId: activeScanId,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            content: m.content
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        const botMsg: ChatMessage = {
          id: "bot_" + Date.now(),
          sender: "bot",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(data.error || "Failed to fetch response from CareerGuard.");
      }
    } catch (err: any) {
      console.error("Chat failure:", err);
      setError(err.message || "Network error. Please make sure server is online.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="chat-assistant-container" className="flex flex-col h-[520px] border border-slate-200/80 rounded-2xl bg-white shadow-md shadow-slate-100 overflow-hidden">
      {/* Chat Header */}
      <div id="chat-header" className="flex items-center justify-between p-4 border-b border-slate-200/80 bg-slate-50">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-display font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              CareerGuard Advisor
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-500 font-medium font-mono">Gemini 3.5 Core Agent</p>
          </div>
        </div>
        {activeCompanyName && (
          <span className="text-[10px] font-display font-extrabold uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
            {activeCompanyName}
          </span>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div id="chat-messages" className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isBot = msg.sender === "bot";
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${isBot ? "" : "flex-row-reverse space-x-reverse"}`}
            >
              <div
                className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${
                  isBot ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              
              <div
                className={`max-w-[80%] rounded-xl p-3 shadow-sm ${
                  isBot
                    ? "bg-white border border-slate-200/80 text-slate-800 text-xs leading-relaxed"
                    : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-xs leading-relaxed"
                }`}
              >
                {/* Simplified markdown formatter for bold lists */}
                <div className="space-y-1 whitespace-pre-line">
                  {msg.content.split("\n").map((line, idx) => {
                    // Check for bullet list
                    if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
                      return (
                        <li key={idx} className="ml-2 pl-1 list-disc font-medium">
                          {line.replace(/^[-•]\s*/, "")}
                        </li>
                      );
                    }
                    return <p key={idx} className="font-medium">{line}</p>;
                  })}
                </div>
                <span className={`block text-[8px] mt-1.5 text-right font-mono ${isBot ? "text-slate-400" : "text-indigo-200"}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-start space-x-2.5">
            <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips panel */}
      <div id="chat-suggestions" className="px-4 py-2.5 border-t border-slate-200/80 bg-slate-50/80 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            disabled={loading}
            className="inline-block bg-white border border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[10px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-150"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input panel */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center p-3 border-t border-slate-200/80 bg-slate-50"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Type your message..."
          className="flex-1 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500/80 text-xs px-3.5 py-2.5 rounded-xl outline-none transition-all duration-200"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="ml-2 flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer shadow-md transition-colors duration-200"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
