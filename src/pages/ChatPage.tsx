import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RotateCcw, Loader2, AlertCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Header } from '../components/Header';
import { useCRM } from '../context/DataContext';
import { useRloe } from '../context/RloeContext';
import { queryGtmCopilot, GtmCopilotMessage } from '../services/ai';
import { RloeStatusBadge } from '../components/RloeStatusBadge';

interface ChatPageProps {
  onToggleMobileSidebar: () => void;
  onOpenSettings?: () => void;
  title?: string;
}

const QUICK_PROMPTS = [
  'Summarize recent inbound signals',
  'Which accounts need immediate attention?',
  'Explain active routing and triage rules',
  'What deals are currently in progress?',
];

export const ChatPage: React.FC<ChatPageProps> = ({
  onToggleMobileSidebar,
  onOpenSettings,
  title = 'GTM AI Co-pilot',
}) => {
  const { opportunities, accounts } = useCRM();
  const { settings, telemetry } = useRloe();

  const [messages, setMessages] = useState<GtmCopilotMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text: 'Hello! I am your GTM Operations AI Co-pilot. I analyze inbound intent signals, explain RLOE routing triage across Lanes A-D, and provide actionable deal intelligence.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastErrorPrompt, setLastErrorPrompt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: GtmCopilotMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
      status: 'done',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setLastErrorPrompt(null);

    try {
      const response = await queryGtmCopilot(trimmed, settings, {
        telemetry,
        accounts,
        opportunities,
      });

      const assistantMsg: GtmCopilotMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        structured: response.structured,
        timestamp: new Date().toISOString(),
        status: 'done',
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setLastErrorPrompt(trimmed);
      const errorMsg: GtmCopilotMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to reach the GTM AI reasoning service. Please check your network or verify the endpoint in Settings.',
        errorMessage: err.message,
        timestamp: new Date().toISOString(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `clear_${Date.now()}`,
        sender: 'assistant',
        text: 'Conversation cleared. What account, inbound signal, or routing decision would you like to analyze next?',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-hidden relative">
      <Header
        onToggleMobileSidebar={onToggleMobileSidebar}
        title={title}
        icon="opportunities"
        onOpenSettings={onOpenSettings}
      />

      <div className="flex flex-col flex-1 min-h-0 max-w-4xl mx-auto w-full p-4 sm:p-6">
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">RLOE Model Engine Active</span>
            <span className="text-[11px]">({settings.nvidiaModel})</span>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
            title="Clear message history"
          >
            <RotateCcw className="size-3" />
            <span>Clear conversation</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'assistant' && (
                <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Sparkles className="size-3.5" />
                </div>
              )}

              <div
                className={`rounded-xl p-3.5 max-w-[85%] space-y-2.5 ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                    : m.status === 'error'
                    ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                    : 'bg-muted/60 border border-border text-foreground shadow-2xs'
                }`}
              >
                {/* Structured Scoring Card if present */}
                {m.structured && (
                  <div className="rounded-lg border border-border/80 bg-background/90 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-border/60">
                      <span className="font-semibold text-foreground">{m.structured.account}</span>
                      {m.structured.routing && (
                        <RloeStatusBadge route={m.structured.routing as any} />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {m.structured.icpFit !== undefined && (
                        <div className="p-2 rounded bg-muted/40 border border-border/40">
                          <span className="text-muted-foreground block text-[10px]">ICP Fit Score</span>
                          <span className="font-bold text-sm text-foreground">{m.structured.icpFit}/100</span>
                        </div>
                      )}
                      {m.structured.intentStrength !== undefined && (
                        <div className="p-2 rounded bg-muted/40 border border-border/40">
                          <span className="text-muted-foreground block text-[10px]">Intent Strength</span>
                          <span className="font-bold text-sm text-foreground">{m.structured.intentStrength}/100</span>
                        </div>
                      )}
                    </div>

                    {m.structured.reason && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                        <strong>Rationale:</strong> {m.structured.reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Markdown / text body */}
                <div className="whitespace-pre-line leading-relaxed">
                  {m.text}
                </div>

                {/* Error & Retry */}
                {m.status === 'error' && lastErrorPrompt && (
                  <button
                    type="button"
                    onClick={() => handleSendMessage(lastErrorPrompt)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive hover:underline pt-1"
                  >
                    <RotateCcw className="size-3" />
                    <span>Retry query</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing / Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start text-xs items-center">
              <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Sparkles className="size-3.5" />
              </div>
              <div className="rounded-xl px-3.5 py-2.5 bg-muted/60 border border-border flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Evaluating GTM context and routing logic…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 py-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={handleFormSubmit} className="pt-2 border-t border-border flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about accounts, intent scoring, or routing logic (Enter to send, Shift+Enter for newline)…"
            className="flex-1 max-h-32 min-h-[38px] resize-none rounded-control border border-input bg-background p-2.5 text-xs outline-none focus:border-ring placeholder:text-muted-foreground/60 leading-relaxed"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="size-9 rounded-control bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 outline-none transition-colors disabled:opacity-50 shrink-0"
            aria-label="Send query"
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
