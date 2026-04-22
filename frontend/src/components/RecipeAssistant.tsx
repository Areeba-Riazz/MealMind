import { useState, useEffect, useRef } from 'react';

interface RecipeAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  recipeName: string;
  selectedItem: string;
  contextInstructions?: string[];
  contextIngredients?: any[];
  /** If true, renders inline inside a layout panel instead of a fixed sidebar. */
  inline?: boolean;
}

export default function RecipeAssistant({
  isOpen,
  onClose,
  recipeName,
  selectedItem,
  contextInstructions,
  contextIngredients,
  inline = false
}: RecipeAssistantProps) {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedItem) {
      setMessages([
        { role: 'ai', text: `I noticed you clicked on "${selectedItem}". How can I help with this part of the ${recipeName}? Do you need a substitute or technical explanation?` }
      ]);
    }
  }, [isOpen, selectedItem, recipeName]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async (customMsg?: string) => {
    const text = customMsg || input;
    if (!text.trim()) return;

    const newMessages = [...messages, { role: 'user', text } as const];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/recipe/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName,
          selectedItem,
          question: text,
          contextInstructions,
          contextIngredients
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'ai', text: data.reply || "Sorry, I couldn't get an answer right now." }]);
    } catch {
      setMessages([...newMessages, { role: 'ai', text: "Connection error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <style>{`
        .ra-shell {
          display: flex;
          flex-direction: column;
          /* ── CRITICAL: height must be 100% of the parent, never more ── */
          height: 100%;
          overflow: hidden;
          ${!inline ? `
            position: fixed; right: 0; top: 0; bottom: 0; width: 400px;
            background: var(--dash-card-bg); border-left: 1px solid var(--border);
            z-index: 1000; box-shadow: -20px 0 60px rgba(0,0,0,0.5);
            transform: translateX(${isOpen ? '0' : '100%'});
            transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
            backdrop-filter: blur(25px);
          ` : `
            background: transparent;
            width: 100%;
          `}
        }

        /* Header hidden in inline mode — RecipeDetailPage owns the header */
        .ra-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
          display: ${inline ? 'none' : 'flex'};
          align-items: center;
          justify-content: space-between;
          background: rgba(232,82,42,0.03);
          flex-shrink: 0;
        }
        .ra-header h3 { margin: 0; font-family: 'Syne', sans-serif; font-size: 1.1rem; font-weight: 800; color: var(--text); }
        .ra-close { background: transparent; border: none; font-size: 1.5rem; color: var(--muted); cursor: pointer; transition: color 0.2s; }
        .ra-close:hover { color: #fff; }

        /* ── CRITICAL: flex: 1 + min-height: 0 lets the chat area shrink ──
           Without min-height: 0, flex children refuse to shrink below their
           content size, so the chat overflows and pushes the input off screen. */
        .ra-chat {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          scroll-behavior: smooth;
        }

        .ra-msg { max-width: 85%; padding: 0.9rem 1.1rem; border-radius: 18px; font-size: 0.9rem; line-height: 1.5; }
        .ra-msg.ai { align-self: flex-start; background: var(--glass-overlay); border: 1px solid var(--border); border-bottom-left-radius: 4px; color: var(--text-dim); }
        .ra-msg.user { align-self: flex-end; background: var(--accent); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(232,82,42,0.2); }

        .ra-typing { font-size: 0.75rem; color: var(--muted); margin-top: -0.5rem; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

        /* Input area never shrinks — always visible at the bottom */
        .ra-input-area {
          flex-shrink: 0;
          padding: 0.8rem 1.2rem 1.2rem;
          border-top: 1px solid var(--border);
          background: rgba(0,0,0,0.1);
        }
        .ra-suggestions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.8rem; }
        .ra-suggestion { padding: 0.4rem 0.8rem; border-radius: 100px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--muted); font: 600 0.72rem 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .ra-suggestion:hover { border-color: var(--accent); color: var(--accent); background: rgba(232,82,42,0.05); }

        .ra-input-wrap { display: flex; gap: 0.6rem; }
        .ra-input { flex: 1; background: var(--input-bg); border: 1px solid var(--border2); border-radius: 12px; padding: 0.75rem 1rem; color: var(--text); font: 0.9rem 'DM Sans', sans-serif; outline: none; }
        .ra-input:focus { border-color: rgba(232,82,42,0.5); background: rgba(232,82,42,0.03); }
        .ra-send-btn { width: 44px; height: 44px; border-radius: 10px; background: var(--accent); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: transform 0.2s; flex-shrink: 0; }
        .ra-send-btn:hover { transform: scale(1.05); }

        .ra-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999; display: ${isOpen && !inline ? 'block' : 'none'}; }

        @media (max-width: 500px) {
          .ra-shell { width: 100%; border-left: none; }
        }
      `}</style>

      {!inline && <div className="ra-overlay" onClick={onClose} />}

      <div className="ra-shell">
        <header className="ra-header">
          <h3>👨‍🍳 Chef Assistant</h3>
          <button className="ra-close" onClick={onClose}>&times;</button>
        </header>

        <div className="ra-chat" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ra-msg ${m.role}`}>{m.text}</div>
          ))}
          {isTyping && <div className="ra-typing">Chef is typing...</div>}
        </div>

        <div className="ra-input-area">
          <div className="ra-suggestions">
            <button className="ra-suggestion" onClick={() => handleSend("What can I use instead of this?")}>Substitutes?</button>
            <button className="ra-suggestion" onClick={() => handleSend("Explain how to do this step.")}>Explain technique</button>
            <button className="ra-suggestion" onClick={() => handleSend("I don't have this, what should I do?")}>Missing item</button>
          </div>
          <div className="ra-input-wrap">
            <input
              className="ra-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="ra-send-btn" onClick={() => handleSend()}>🚀</button>
          </div>
        </div>
      </div>
    </>
  );
}