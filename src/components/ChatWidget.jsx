import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import './ChatWidget.css';

// ─── Inline SVGs ──────────────────────────────────────────────────────────────
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

const IconBot = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <line x1="12" y1="7" x2="12" y2="11"/>
    <line x1="8" y1="15" x2="8" y2="17"/>
    <line x1="16" y1="15" x2="16" y2="17"/>
  </svg>
);

// ─── FAQ questions (always visible) ──────────────────────────────────────────
const FAQ = [
  "What's your work experience?",
  "Tell me about your projects",
  "What skills do you have?",
];

// ─── API endpoint ─────────────────────────────────────────────────────────────
const API_URL = '/api/chat';

// ─── ChatWidget ───────────────────────────────────────────────────────────────
function ChatWidget() {
  const [isOpen,      setIsOpen]      = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error,       setError]       = useState(null);
  const [hasUnread,   setHasUnread]   = useState(false);

  const messagesEndRef     = useRef(null);
  const inputRef           = useRef(null);
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

  // ─── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    setInput('');
    setError(null);

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

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
            if (parsed.error) throw new Error(parsed.error);
          } catch {}
        }
      }

      if (!isOpen) setHasUnread(true);

    } catch (err) {
      if (err.name === 'AbortError') return;

      const errMsg = err.message || 'Connection error. Please try again.';
      setError(errMsg);

      setMessages(prev => {
        const updated = [...prev];
        const lastIdx  = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant' && !updated[lastIdx].content) {
          updated.splice(lastIdx, 1);
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, isOpen]);

  // ─── Keyboard submit ──────────────────────────────────────────────────────
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
      setMessages(prev => {
        const idx = [...prev].reverse().findIndex(m => m.role === 'user' && m.content === lastUser.content);
        const actual = prev.length - 1 - idx;
        return prev.filter((_, i) => i !== actual);
      });
      setError(null);
      sendMessage(lastUser.content);
    }
  }, [messages, sendMessage]);

  // ─── Render ───────────────────────────────────────────────────────────────
  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <>
      {/* Chat Window */}
      <div
        className={`chat-window${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-label="Chat with Nishan's AI assistant"
        aria-modal="true"
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar" aria-hidden="true">
              <IconBot />
            </div>
            <div>
              <div className="chat-header-title">Ask about Nishan</div>
              <div className="chat-header-sub">RAG AI assistant · usually instant</div>
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
              <p className="chat-welcome-text">
                Hi! I'm Nishan's AI assistant. Ask me about his experience, projects, or skills.
              </p>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-msg ${msg.role}`}>
              <div className="chat-bubble">
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isStreaming && messages[messages.length - 1]?.content === '' && (
            <div className="chat-typing" aria-label="AI is typing">
              <div className="chat-typing-dot" />
              <div className="chat-typing-dot" />
              <div className="chat-typing-dot" />
            </div>
          )}

          {/* Error state */}
          {error && !isStreaming && (
            <div className="chat-error">
              <div className="chat-error-bubble">{error}</div>
              <button className="chat-retry-btn" onClick={retry}>
                Try again
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          {/* FAQ chips — always visible */}
          <div className="chat-faq" role="group" aria-label="Frequently asked questions">
            <span className="chat-faq-label">Frequently asked</span>
            <div className="chat-faq-chips">
              {FAQ.map(q => (
                <button
                  key={q}
                  className="chat-faq-chip"
                  onClick={() => sendMessage(q)}
                  disabled={isStreaming}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input row */}
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask anything about Nishan..."
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
      </div>

      {/* Toggle Button */}
      <button
        className={`chat-toggle${isOpen ? ' open' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open AI chat about Nishan'}
        aria-expanded={isOpen}
      >
        {isOpen ? <IconClose /> : <IconChat />}
        {!isOpen && hasUnread && <span className="chat-toggle-dot" aria-hidden="true" />}
        {!isOpen && (
          <span className="chat-tooltip" role="tooltip">
            RAG-powered AI assistant trained on Nishan's resume, projects and skills
          </span>
        )}
      </button>
    </>
  );
}

export default memo(ChatWidget);
