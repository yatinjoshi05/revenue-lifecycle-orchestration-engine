import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, RotateCcw, Loader2, ArrowUpRight, MessageSquare, Minimize2 } from 'lucide-react';
import { useCRM } from '../context/DataContext';
import { useRloe } from '../context/RloeContext';
import { queryGtmCopilot, GtmCopilotMessage } from '../services/ai';
import { RloeStatusBadge } from './RloeStatusBadge';

const STORAGE_POS_KEY = 'gtm_assistant_ball_pos_v2';

export const MovableAssistant: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { opportunities, accounts, tasks } = useCRM();
  const { settings, telemetry, inboundLogs } = useRloe();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GtmCopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Position state (coordinates in pixels)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    // Default bottom-right
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(16, window.innerWidth - 72),
        y: Math.max(16, window.innerHeight - 72),
      };
    }
    return { x: 500, y: 500 };
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  const ballRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine page context name
  const pageContext = React.useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/opportunities')) return 'Opportunities';
    if (path.startsWith('/accounts')) return 'Accounts';
    if (path.startsWith('/contacts')) return 'Contacts';
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/telemetry')) return 'Operations';
    if (path.startsWith('/chat')) return 'AI Assistant';
    if (path.startsWith('/home') || path === '/') return 'Home';
    return 'RevOps';
  }, [location.pathname]);

  // Context-aware quick prompt suggestions
  const contextualPrompts = React.useMemo(() => {
    switch (pageContext) {
      case 'Opportunities':
        return [
          'Which deals are at risk?',
          'Summarize pipeline health',
          'What deals are in negotiation?',
        ];
      case 'Accounts':
        return [
          'Which accounts need attention?',
          'Show account portfolio summary',
        ];
      case 'Tasks':
        return [
          'What tasks are overdue?',
          'What should I prioritize today?',
        ];
      case 'Operations':
        return [
          'Explain the 4 execution lanes',
          'Why are signals routed for review?',
          'How does cache triage save cost?',
        ];
      case 'Home':
      default:
        return [
          'What demands my attention today?',
          'Summarize active deals and tasks',
        ];
    }
  }, [pageContext]);

  // Clamp position to viewport bounds on window resize
  const clampPosition = useCallback((x: number, y: number) => {
    const ballSize = 48;
    const padding = 16;
    const maxX = Math.max(padding, window.innerWidth - ballSize - padding);
    const maxY = Math.max(padding, window.innerHeight - ballSize - padding);
    return {
      x: Math.min(Math.max(padding, x), maxX),
      y: Math.min(Math.max(padding, y), maxY),
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isDraggingRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pos.x,
      initY: pos.y,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;
      if (!isDraggingRef.current && Math.hypot(dx, dy) > 6) {
        isDraggingRef.current = true;
      }
      if (isDraggingRef.current) {
        const next = clampPosition(
          dragStartRef.current.initX + dx,
          dragStartRef.current.initY + dy
        );
        setPos(next);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (isDraggingRef.current) {
        try {
          localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(pos));
        } catch {}
      } else {
        // Pure click: toggle panel
        setIsOpen((prev) => !prev);
      }
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

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
      const errorMsg: GtmCopilotMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to reach the assistant reasoning service. Please check your network or Settings.',
        errorMessage: err.message,
        timestamp: new Date().toISOString(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  // Scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Initial welcome greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Hello! I am your GTM Operations Assistant. Currently monitoring **${pageContext}**. Ask me to analyze pipeline risks, accounts, or routing triage.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [pageContext, messages.length]);

  // Determine popup panel placement relative to ball
  const panelOnLeft = pos.x > window.innerWidth / 2;
  const panelOnTop = pos.y > window.innerHeight / 2;

  return (
    <>
      {/* Floating Movable Assistant Ball */}
      <div
        ref={ballRef}
        onPointerDown={handlePointerDown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Toggle AI Assistant"
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          touchAction: 'none',
          userSelect: 'none',
        }}
        className={`z-50 size-11 rounded-full shadow-lg border border-border flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform focus-visible:ring-2 focus-visible:ring-ring outline-none ${
          isOpen
            ? 'bg-primary text-primary-foreground scale-105 ring-2 ring-primary/40'
            : 'bg-card text-foreground hover:bg-muted hover:scale-105'
        }`}
        title="AI Assistant (drag to move, click to open)"
      >
        <Sparkles className={`size-5 shrink-0 transition-transform ${isOpen ? 'text-primary-foreground' : 'text-blue-600 dark:text-blue-400'}`} />
        <span className="sr-only">Toggle AI Assistant</span>
      </div>

      {/* Compact Floating Assistant Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="AI Assistant Panel"
          style={{
            position: 'fixed',
            left: panelOnLeft ? Math.max(16, pos.x - 360) : Math.min(window.innerWidth - 376, pos.x + 56),
            top: panelOnTop ? Math.max(16, pos.y - 480) : Math.min(window.innerHeight - 500, pos.y),
          }}
          className="z-50 w-[360px] max-w-[calc(100vw-32px)] h-[480px] max-h-[calc(100vh-32px)] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden text-foreground animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5 bg-muted/30 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-6 rounded-control bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Sparkles className="size-3" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">AI Operations Assistant</span>
                </div>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Context: <strong className="text-foreground font-medium">{pageContext}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([])}
                className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Reset conversation"
              >
                <RotateCcw className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/chat/new');
                }}
                className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Open full page chat"
              >
                <ArrowUpRight className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Close assistant"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs leading-relaxed">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="size-2.5" />
                  </div>
                )}
                <div
                  className={`rounded-lg p-2.5 max-w-[85%] text-[11px] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : m.status === 'error'
                      ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                      : 'bg-muted/70 border border-border text-foreground'
                  }`}
                >
                  {/* Structured snippet if present */}
                  {m.structured && (
                    <div className="mb-2 p-2 rounded bg-background border border-border/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-[10px] truncate">
                          {m.structured.account}
                        </span>
                        {m.structured.routing && (
                          <RloeStatusBadge route={m.structured.routing as any} showIcon={false} />
                        )}
                      </div>
                      {m.structured.reason && (
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {m.structured.reason}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="whitespace-pre-line">{m.text}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start items-center text-xs text-muted-foreground">
                <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Sparkles className="size-2.5" />
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/60 border border-border text-[11px]">
                  <Loader2 className="size-3 animate-spin" />
                  <span>Analyzing {pageContext}…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Contextual Suggestion Chips */}
          <div className="px-3 py-1.5 border-t border-border bg-muted/20 flex flex-wrap gap-1">
            {contextualPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-2 py-0.5 rounded text-[10px] border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Quick Input Bar */}
          <form onSubmit={handleSubmit} className="p-2 border-t border-border flex items-center gap-1.5 bg-background">
            <input
              type="text"
              placeholder={`Ask about ${pageContext}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-8 rounded-control border border-input bg-background px-2.5 text-xs outline-none focus:border-ring placeholder:text-muted-foreground/60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="size-8 rounded-control bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 outline-none transition-colors disabled:opacity-50 shrink-0"
              aria-label="Submit message"
            >
              <Send className="size-3" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default MovableAssistant;
