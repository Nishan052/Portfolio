import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import './ChatWidget.css';

// ─── Inline SVGs (no lucide-react) ────────────────────────────────────────────
const IconChat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

// ─── Starter questions ────────────────────────────────────────────────────────
const STARTERS = [
  "What's your work experience?",
  "Tell me about your projects",
  "What skills do you have?",
];

// ─── Chat API endpoint ────────────────────────────────────────────────────────
const API_URL = '/api/chat';

// ─── ChatWidget Component ─────────────────────────────────────────────────────
function ChatWidget() {
  const [isOpen,      setIsOpen]      = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error,       setError]       = useState(null);
  const [hasUnread,   setHasUnread]   = useState(false);

  const messagesEndRef   = useRef(null);
  const inputRef         = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // ─── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    setInput('');
    setError(null);

    // Add user message
    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Build history (exclude the just-added message)
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    // Add empty assistant message placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    // Abort any ongoing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: msg, history }),
        signal:  abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errMsg = 'Something went wrong. Please try again.';
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      // Stream SSE response
      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: updated[lastIdx].content + parsed.content,
                  };
                }
                return updated;
              });
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (parseErr) {
            if (parseErr.message !== 'Stream interrupted') {
              // Ignore JSON parse errors (might be partial)
            }
          }
        }
      }

      // Show unread dot if chat is closed
      if (!isOpen) setHasUnread(true);

    } catch (err) {
      if (err.name === 'AbortError') return; // User navigated away

      const errMsg = err.message || 'Connection error. Please try again.';
      setError(errMsg);

      // Replace empty assistant message with error state
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx  = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant' && !updated[lastIdx].content) {
          updated.splice(lastIdx, 1); // remove empty placeholder
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, isOpen]);

  // ─── Keyboard submit ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ─── Retry last message ───────────────────────────────────────────────────
  const retry = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      setMessages(prev => prev.filter(m => !(m.role === 'user' && m.content === lastUser.content && prev.indexOf(m) === prev.lastIndexOf(m))));
      setError(null);
      sendMessage(lastUser.content);
    }
  }, [messages, sendMessage]);

  // ─── Render ───────────────────────────────────────────────────────────────
  const showWelcome  = messages.length === 0 && !isStreaming;
  const showStarters = showWelcome;

  return (
    <>
      {/* ── Chat Window ── */}
      <div
        className={`chat-window${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-label="Chat with Nishan's AI assistant"
        aria-modal="true"
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar" aria-hidden="true">🤖</div>
            <div>
              <div className="chat-header-title">Ask about Nishan</div>
              <div className="chat-header-sub">AI assistant · usually instant</div>
            </div>
          </div>
          <button
            className="chat-close-btn"
            onClick={toggleChat}
            aria-label="Close chat"
          >
            <IconClose />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">

          {/* Welcome state */}
          {showWelcome && (
            <div className="chat-welcome">
              <div className="chat-welcome-emoji" aria-hidden="true">👋</div>
              <p className="chat-welcome-text">
                Hi! I'm Nishan's AI assistant. Ask me about his experience, projects, or skills.
              </p>
            </div>
          )}

          {/* Starter chips */}
          {showStarters && (
            <div className="chat-starters" role="group" aria-label="Suggested questions">
              {STARTERS.map(q => (
                <button
                  key={q}
                  className="chat-starter-chip"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-msg ${msg.role}`}>
              <div className="chat-bubble">
                {msg.content || (msg.role === 'assistant' && isStreaming && idx === messages.length - 1 ? '' : msg.content)}
              </div>
            </div>
          ))}

          {/* Typing indicator (only when streaming and last message is empty) */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className="chat-typing" aria-label="Nishan's AI is typing">
              <div className="chat-typing-dot" />
              <div className="chat-typing-dot" />
              <div className="chat-typing-dot" />
            </div>
          )}

          {/* Error state */}
          {error && !isStreaming && (
            <div className="chat-error">
              <div className="chat-error-bubble">⚠ {error}</div>
              <button className="chat-retry-btn" onClick={retry}>
                Try again
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask anything about Nishan…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={500}
            aria-label="Type your message"
            disabled={isStreaming}
          />
          <button
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
          >
            <IconSend />
          </button>
        </div>
      </div>

      {/* ── Toggle Button ── */}
      <button
        className="chat-toggle"
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open AI chat about Nishan'}
        aria-expanded={isOpen}
      >
        {isOpen ? <IconClose /> : <IconChat />}
        {!isOpen && hasUnread && <span className="chat-toggle-dot" aria-hidden="true" />}
      </button>
    </>
  );
}

export default memo(ChatWidget);
