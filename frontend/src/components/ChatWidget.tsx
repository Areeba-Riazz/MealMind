import { useState, useRef, useEffect } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { useTheme } from '../context/ThemeContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  "What can I cook with chicken and rice? 🍚",
  "Suggest a meal under 400 PKR 💸",
  "I want something spicy and quick 🌶️",
  "What's a good high-protein breakfast? 💪",
  "I'm craving desi comfort food 🍛",
];

function httpErrorHint(status: number): string {
  if (status === 502 || status === 503) return 'The assistant is temporarily unavailable. Try again soon.';
  if (status === 429) return 'Too many requests. Wait a moment and try again.';
  if (status === 400) return 'That request could not be sent. Check your message and try again.';
  return 'Something went wrong. Please try again.';
}

/** Keep UI copy short; hide leaked SDK / API stack text. */
function formatChatError(err: unknown): string {
  const msg = err instanceof Error ? err.message.trim() : String(err);
  if (!msg) return 'Something went wrong. Please try again.';
  if (
    msg.length > 240 ||
    /GoogleGenerativeAI|generativelanguage\.googleapis|type\.googleapis\.com|fieldViolations|Bad Request\] Invalid/i.test(
      msg
    )
  ) {
    return 'Something went wrong. Please try again.';
  }
  return msg;
}

export default function ChatWidget() {
  const { preferences } = usePreferences();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasPrefs =
    preferences.cuisines.length > 0 ||
    !!preferences.budget ||
    !!preferences.goal ||
    !!preferences.customPreferences;

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && messages.length > 0 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          userPreferences: preferences,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok) {
        const fromServer = typeof data.error === 'string' ? data.error.trim() : '';
        throw new Error(fromServer || httpErrorHint(res.status));
      }
      if (typeof data.reply !== 'string') {
        throw new Error('Something went wrong. Please try again.');
      }
      const reply = data.reply;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(formatChatError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      <style>{`
        /* ── Theme-aware colors ── */
        .cw-theme-dark { --cw-bg: rgba(16,16,16,0.97); --cw-border: rgba(255,255,255,0.1); --cw-text: #f2ede4; --cw-text-muted: rgba(255,255,255,0.35); --cw-text-disabled: rgba(255,255,255,0.22); --cw-header-bg: rgba(22,22,22,0.6); --cw-panel-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,82,42,0.1); --cw-input-bg: rgba(255,255,255,0.05); --cw-input-border: rgba(255,255,255,0.1); --cw-focus-shadow: 0 0 0 3px rgba(232,82,42,0.1); --cw-focus-bg: rgba(232,82,42,0.04); --cw-suggestion-bg: rgba(255,255,255,0.03); --cw-suggestion-border: rgba(255,255,255,0.08); --cw-empty-bg: transparent; --cw-bubble-assistant-bg: rgba(255,255,255,0.05); --cw-bubble-assistant-border: rgba(255,255,255,0.09); --cw-bubble-assistant-text: rgba(255,255,255,0.87); --cw-input-area-bg: rgba(14,14,14,0.6); --cw-input-area-border: rgba(255,255,255,0.07); --cw-prefs-bg: rgba(232,82,42,0.07); --cw-prefs-border: rgba(232,82,42,0.2); --cw-prefs-text: rgba(232,82,42,0.85); }
        .cw-theme-light { --cw-bg: rgba(255,255,255,0.95); --cw-border: rgba(0,0,0,0.1); --cw-text: #1a1a1a; --cw-text-muted: rgba(0,0,0,0.55); --cw-text-disabled: rgba(0,0,0,0.3); --cw-header-bg: rgba(245,245,245,0.9); --cw-panel-shadow: 0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(232,82,42,0.15); --cw-input-bg: rgba(0,0,0,0.04); --cw-input-border: rgba(0,0,0,0.12); --cw-focus-shadow: 0 0 0 3px rgba(232,82,42,0.15); --cw-focus-bg: rgba(232,82,42,0.06); --cw-suggestion-bg: rgba(0,0,0,0.03); --cw-suggestion-border: rgba(0,0,0,0.1); --cw-empty-bg: transparent; --cw-bubble-assistant-bg: rgba(0,0,0,0.04); --cw-bubble-assistant-border: rgba(0,0,0,0.1); --cw-bubble-assistant-text: rgba(0,0,0,0.85); --cw-input-area-bg: rgba(255,255,255,0.8); --cw-input-area-border: rgba(0,0,0,0.08); --cw-prefs-bg: rgba(232,82,42,0.08); --cw-prefs-border: rgba(232,82,42,0.25); --cw-prefs-text: rgba(232,82,42,0.75); }
        
        /* ── FAB button ── */
        .cw-fab {
          position: fixed;
          bottom: 1.8rem;
          right: 1.8rem;
          z-index: 999;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #e8522a, #f5c842);
          color: #fff;
          font-size: 1.4rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 28px rgba(232,82,42,0.45);
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s;
          outline: none;
        }
        .cw-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 10px 36px rgba(232,82,42,0.55);
        }
        .cw-fab.open { transform: scale(0.92) rotate(90deg); }

        /* ── Widget panel ── */
        .cw-panel {
          position: fixed;
          bottom: 5.2rem;
          right: 1.8rem;
          z-index: 998;
          width: min(390px, calc(100vw - 2rem));
          height: min(560px, calc(100vh - 8rem));
          background: var(--cw-bg);
          border: 1px solid var(--cw-border);
          border-radius: 22px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--cw-panel-shadow);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          transform-origin: bottom right;
          animation: cwSlideIn 0.3s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cwSlideIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Header ── */
        .cw-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.1rem 0.9rem;
          border-bottom: 1px solid var(--cw-border);
          flex-shrink: 0;
          background: var(--cw-header-bg);
        }
        .cw-header-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(232,82,42,0.25), rgba(245,200,66,0.15));
          border: 1px solid rgba(232,82,42,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .cw-header-text { flex: 1; min-width: 0; }
        .cw-header-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--cw-text);
          margin: 0;
          letter-spacing: -0.2px;
        }
        .cw-header-sub {
          font-size: 0.7rem;
          color: var(--cw-text-muted);
          margin: 0;
        }
        .cw-header-actions { display: flex; gap: 0.3rem; }
        .cw-header-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid var(--cw-border);
          background: transparent;
          color: var(--cw-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          transition: all 0.18s;
        }
        .cw-header-btn:hover { color: var(--cw-text); background: rgba(232,82,42,0.05); }

        /* ── Prefs badge ── */
        .cw-prefs-badge {
          margin: 0.6rem 1rem 0;
          padding: 0.4rem 0.75rem;
          background: var(--cw-prefs-bg);
          border: 1px solid var(--cw-prefs-border);
          border-radius: 10px;
          font-size: 0.7rem;
          color: var(--cw-prefs-text);
          flex-shrink: 0;
        }

        /* ── Messages area ── */
        .cw-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          scrollbar-width: thin;
          scrollbar-color: var(--cw-border) transparent;
        }
        .cw-messages::-webkit-scrollbar { width: 4px; }
        .cw-messages::-webkit-scrollbar-track { background: transparent; }
        .cw-messages::-webkit-scrollbar-thumb { background: var(--cw-border); border-radius: 10px; }

        /* ── Empty state ── */
        .cw-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          text-align: center;
          gap: 0.5rem;
        }
        .cw-empty-icon { font-size: 2.6rem; margin-bottom: 0.4rem; }
        .cw-empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--cw-text);
          margin: 0;
        }
        .cw-empty-sub { font-size: 0.78rem; color: var(--cw-text-muted); margin: 0 0 1rem; line-height: 1.5; }
        .cw-suggestions { display: flex; flex-direction: column; gap: 0.4rem; width: 100%; }
        .cw-suggestion-btn {
          padding: 0.5rem 0.8rem;
          background: var(--cw-suggestion-bg);
          border: 1px solid var(--cw-suggestion-border);
          border-radius: 10px;
          color: var(--cw-text-muted);
          font: 500 0.78rem 'DM Sans', sans-serif;
          cursor: pointer;
          text-align: left;
          transition: all 0.18s;
          line-height: 1.4;
        }
        .cw-suggestion-btn:hover {
          border-color: rgba(232,82,42,0.35);
          background: rgba(232,82,42,0.07);
          color: var(--cw-text);
        }

        /* ── Message bubbles ── */
        .cw-msg {
          display: flex;
          flex-direction: column;
          max-width: 88%;
          animation: cwMsgIn 0.25s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cwMsgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cw-msg.user { align-self: flex-end; align-items: flex-end; }
        .cw-msg.assistant { align-self: flex-start; align-items: flex-start; }
        .cw-bubble {
          padding: 0.65rem 0.9rem;
          border-radius: 16px;
          font-size: 0.85rem;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .cw-msg.user .cw-bubble {
          background: linear-gradient(135deg, rgba(232,82,42,0.22), rgba(232,82,42,0.14));
          border: 1px solid rgba(232,82,42,0.3);
          color: var(--cw-text);
          border-bottom-right-radius: 5px;
        }
        .cw-msg.assistant .cw-bubble {
          background: var(--cw-bubble-assistant-bg);
          border: 1px solid var(--cw-bubble-assistant-border);
          color: var(--cw-bubble-assistant-text);
          border-bottom-left-radius: 5px;
        }

        /* ── Typing indicator ── */
        .cw-typing {
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.7rem 1rem;
          background: var(--cw-bubble-assistant-bg);
          border: 1px solid var(--cw-bubble-assistant-border);
          border-radius: 16px;
          border-bottom-left-radius: 5px;
        }
        .cw-dot {
          width: 6px;
          height: 6px;
          background: var(--cw-text-muted);
          border-radius: 50%;
          animation: cwDot 1.2s infinite;
        }
        .cw-dot:nth-child(2) { animation-delay: 0.2s; }
        .cw-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes cwDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        /* ── Error ── */
        .cw-error {
          font-size: 0.78rem;
          color: #ff8a8a;
          padding: 0.5rem 0.8rem;
          background: rgba(255,80,80,0.07);
          border: 1px solid rgba(255,80,80,0.18);
          border-radius: 10px;
          align-self: flex-start;
          max-width: 88%;
        }

        /* ── Input area ── */
        .cw-input-area {
          padding: 0.8rem 1rem;
          border-top: 1px solid var(--cw-input-area-border);
          display: flex;
          gap: 0.55rem;
          align-items: flex-end;
          flex-shrink: 0;
          background: var(--cw-input-area-bg);
        }
        .cw-textarea {
          flex: 1;
          background: var(--cw-input-bg);
          border: 1px solid var(--cw-input-border);
          border-radius: 13px;
          color: var(--cw-text);
          font: 0.87rem 'DM Sans', sans-serif;
          padding: 0.65rem 0.85rem;
          resize: none;
          outline: none;
          min-height: 40px;
          max-height: 110px;
          overflow-y: auto;
          transition: border-color 0.2s, box-shadow 0.2s;
          line-height: 1.5;
          scrollbar-width: thin;
          scrollbar-color: var(--cw-border) transparent;
        }
        .cw-textarea::placeholder { color: var(--cw-text-disabled); }
        .cw-textarea:focus {
          border-color: rgba(232,82,42,0.5);
          box-shadow: var(--cw-focus-shadow);
          background: var(--cw-focus-bg);
        }
        .cw-send-btn {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          border: none;
          background: var(--accent, #e8522a);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          transition: all 0.18s;
          box-shadow: 0 4px 14px rgba(232,82,42,0.3);
        }
        .cw-send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(232,82,42,0.45);
        }
        .cw-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }
      `}</style>

      {/* FAB trigger button */}
      <button
        className={`cw-fab${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close chat' : 'Open MealMind chat'}
        title={isOpen ? 'Close chat' : 'Chat with MealMind AI'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className={`cw-panel cw-theme-${isDark ? 'dark' : 'light'}`} role="dialog" aria-label="MealMind AI Chat">
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-icon">🍛</div>
            <div className="cw-header-text">
              <p className="cw-header-title">MealMind AI</p>
              <p className="cw-header-sub">Your personal food assistant</p>
            </div>
            <div className="cw-header-actions">
              {messages.length > 0 && (
                <button className="cw-header-btn" onClick={clearChat} title="Clear chat">🗑</button>
              )}
              <button className="cw-header-btn" onClick={() => setIsOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Preferences context badge */}
          {hasPrefs && (
            <div className="cw-prefs-badge">
              ✓ Using your saved preferences as context
            </div>
          )}

          {/* Messages */}
          <div className="cw-messages">
            {messages.length === 0 ? (
              <div className="cw-empty">
                <div className="cw-empty-icon">🍽️</div>
                <p className="cw-empty-title">What's on your mind?</p>
                <p className="cw-empty-sub">
                  Ask me anything about meals, recipes, budget, cravings, or your dietary needs.
                </p>
                <div className="cw-suggestions">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      className="cw-suggestion-btn"
                      onClick={() => sendMessage(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`cw-msg ${msg.role}`}>
                    <div className="cw-bubble">{msg.content}</div>
                  </div>
                ))}
                {isLoading && (
                  <div className="cw-typing">
                    <div className="cw-dot" />
                    <div className="cw-dot" />
                    <div className="cw-dot" />
                  </div>
                )}
                {error && <div className="cw-error">{error}</div>}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="cw-input-area">
            <textarea
              ref={inputRef}
              className="cw-textarea"
              placeholder="Ask about meals, recipes, budget..."
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            <button
              className="cw-send-btn"
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}