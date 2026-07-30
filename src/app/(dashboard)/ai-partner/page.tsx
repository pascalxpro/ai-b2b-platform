'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Paperclip, 
  Lightbulb, 
  Search, 
  FileText,
  TrendingUp
} from 'lucide-react';

export default function AIPartnerPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), role: 'user', content: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        content: '這是一個自動回覆訊息。API 尚未串接。',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.mainChat} glass-1`}>
        {/* Header */}
        <div className={`${styles.header} glass-2`}>
          <div className={styles.titleArea}>
            <div className={styles.iconBox}>
              <Bot size={24} />
              <Sparkles size={14} className={styles.sparkle} />
            </div>
            <h1 className={styles.title}>AI 商業夥伴</h1>
          </div>
          <div className={styles.status}>
            <span className={styles.statusDot}></span>
            線上
          </div>
        </div>

        {/* Message Area */}
        <div className={styles.messageArea}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--color-text-muted)' }}>
              您好！我是您的 AI 商業夥伴。請問有什麼我可以幫助您的嗎？
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`${styles.messageRow} ${msg.role === 'bot' ? styles.messageRowBot : styles.messageRowUser}`}>
                {msg.role === 'bot' && (
                  <div className={styles.messageAvatar}>
                    <Bot size={20} />
                  </div>
                )}
                <div className={`${styles.messageBubble} ${msg.role === 'bot' ? styles.bubbleBot + ' glass-2' : styles.bubbleUser}`}>
                  <div className={styles.messageContent}>
                    <p>{msg.content}</p>
                  </div>
                  <div className={styles.timestamp}>{msg.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className={`${styles.inputContainer} glass-2`}>
          <div className={styles.inputWrapper}>
            <button className={styles.attachBtn} title="附加檔案" onClick={() => alert('附加檔案功能開發中')}>
              <Paperclip size={20} />
            </button>
            <textarea 
              className={styles.input} 
              placeholder="輸入訊息，或嘗試：分析市場、搜尋客戶、撰寫報告..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button className={styles.sendBtn} title="發送" onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Hints */}
      <div className={styles.sidebar}>
        <div className={`${styles.suggestionCard} glass-2`}>
          <h3 className={styles.suggestionTitle}>
            <Lightbulb size={18} className={styles.sparkle} />
            建議指令
          </h3>
          <div className={styles.chips}>
            <div className={styles.chip}>
              <TrendingUp size={16} className={styles.chipIcon} />
              分析市場趨勢
            </div>
            <div className={styles.chip}>
              <Search size={16} className={styles.chipIcon} />
              搜尋潛在客戶
            </div>
            <div className={styles.chip}>
              <FileText size={16} className={styles.chipIcon} />
              生成競品報告
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
