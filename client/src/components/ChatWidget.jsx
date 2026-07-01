import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

const ChatWidget = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [language, setLanguage] = useState('bn');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! আমি Eco AI, আপনাকে কীভাবে সাহায্য করতে পারি?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('https://ecomace.onrender.com/api/chat', { message: userMsg, language });
      setMessages(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'I apologize, but I am currently experiencing technical difficulties. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, maxWidth: 'calc(100vw - 40px)' }}>
      {isChatOpen ? (
        <div className="glass-panel animate-fade-in" style={{ width: '350px', maxWidth: '100%', height: '450px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', borderRadius: '15px' }}>
          {/* Header */}
          <div style={{ padding: '15px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--primary-accent)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={24} />
              <strong style={{ fontSize: '1.1rem' }}>Eco AI</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select value={language} onChange={(e) => {
                setLanguage(e.target.value);
                setMessages([{ sender: 'bot', text: e.target.value === 'bn' ? 'Hello! আমি Eco AI, আপনাকে কীভাবে সাহায্য করতে পারি?' : 'Hello! I am Eco AI, your formal support assistant. How may I assist you today?' }]);
              }} style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '5px', padding: '2px 5px', outline: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                <option value="bn" style={{color: 'black'}}>বাংলা</option>
                <option value="en" style={{color: 'black'}}>English</option>
              </select>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '10px 15px', borderRadius: '15px', backgroundColor: msg.sender === 'user' ? 'var(--primary-accent)' : 'var(--surface-color)', color: msg.sender === 'user' ? 'white' : 'var(--text-primary)', fontSize: '0.95rem', wordWrap: 'break-word', border: msg.sender === 'bot' ? '1px solid var(--glass-border)' : 'none', whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 15px', borderRadius: '15px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Eco AI is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px', backgroundColor: 'var(--surface-color)' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..." 
              style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none' }}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{ background: 'var(--primary-accent)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', opacity: input.trim() && !loading ? 1 : 0.5 }}>
              <Send size={18} style={{ marginLeft: '3px' }} />
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
          {isMenuOpen && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              <button 
                onClick={() => { setIsChatOpen(true); setIsMenuOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '25px', backgroundColor: 'var(--primary-accent)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', fontSize: '1rem', fontWeight: 'bold' }}
              >
                Eco AI Chat <Bot size={20} />
              </button>
              <a 
                href="https://t.me/zihanfakir"
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '25px', backgroundColor: '#0088cc', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', textDecoration: 'none', fontSize: '1rem', fontWeight: 'bold' }}
              >
                Telegram Support <Send size={20} />
              </a>
            </div>
          )}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-accent)', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', transition: 'transform 0.2s ease-in-out' }}
          >
            {isMenuOpen ? <X size={30} /> : <MessageCircle size={30} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
