'use client';

import React from 'react';
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
          <div className={`${styles.messageRow} ${styles.messageRowBot}`}>
            <div className={styles.messageAvatar}>
              <Bot size={20} />
            </div>
            <div className={`${styles.messageBubble} ${styles.bubbleBot} glass-2`}>
              <div className={styles.messageContent}>
                <p>您好！我是您的 AI 商業夥伴。我可以協助您分析市場趨勢、搜尋潛在客戶、準備會議摘要，以及回答商業情報相關問題。請問有什麼我可以幫助您的嗎？</p>
              </div>
              <div className={styles.timestamp}>10:00 AM</div>
            </div>
          </div>

          <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
            <div className={`${styles.messageBubble} ${styles.bubbleUser}`}>
              <div className={styles.messageContent}>
                <p>幫我分析日本食品包裝市場的最新趨勢</p>
              </div>
              <div className={styles.timestamp}>10:02 AM</div>
            </div>
          </div>

          <div className={`${styles.messageRow} ${styles.messageRowBot}`}>
            <div className={styles.messageAvatar}>
              <Bot size={20} />
            </div>
            <div className={`${styles.messageBubble} ${styles.bubbleBot} glass-2`}>
              <div className={styles.messageContent}>
                <h2>日本食品包裝市場趨勢分析</h2>
                
                <h3>1. 環保包裝需求持續增長</h3>
                <p>日本政府推動的減塑政策促使企業尋找替代方案。生物可分解材料及紙質包裝的需求正以每年 15% 的速度成長。</p>
                
                <h3>2. 智慧包裝技術</h3>
                <p>結合 QR Code 與感測器的智慧包裝開始普及，用於提升食品安全追溯及消費者互動體驗。</p>
                
                <h3>3. 市場規模</h3>
                <p>預估 2024 年日本食品包裝市場規模將達到 ¥2.8兆，其中永續包材佔比將突破 30%。</p>
              </div>
              <div className={styles.timestamp}>10:03 AM</div>
            </div>
          </div>

          <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
            <div className={`${styles.messageBubble} ${styles.bubbleUser}`}>
              <div className={styles.messageContent}>
                <p>有哪些潛在的合作夥伴？</p>
              </div>
              <div className={styles.timestamp}>10:05 AM</div>
            </div>
          </div>

          <div className={`${styles.messageRow} ${styles.messageRowBot}`}>
            <div className={styles.messageAvatar}>
              <Bot size={20} />
            </div>
            <div className={`${styles.messageBubble} ${styles.bubbleBot} glass-2`}>
              <div className={styles.messageContent}>
                <p>根據我的搜尋與情報庫，以下是 5 家值得關注的日本食品包裝企業：</p>
                <ol>
                  <li><strong>大日本印刷株式会社 (DNP)</strong> - 擁有 15% 綠色包材市佔率，近期推出新型植物基薄膜。</li>
                  <li><strong>凸版印刷 (Toppan)</strong> - 專注於高阻隔性包裝 GL BARRIER，適合延長食品保存期限。</li>
                  <li><strong>東洋製罐集團</strong> - 在金屬及塑膠容器輕量化技術上具領先地位。</li>
                  <li><strong>Rengo Co., Ltd.</strong> - 日本最大的瓦楞紙箱製造商，積極發展環保紙包裝。</li>
                  <li><strong>Fuji Seal</strong> - 收縮標籤的全球領導者，目前致力於易回收標籤的研發。</li>
                </ol>
              </div>
              <div className={styles.timestamp}>10:06 AM</div>
            </div>
          </div>

          <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
            <div className={`${styles.messageBubble} ${styles.bubbleUser}`}>
              <div className={styles.messageContent}>
                <p>幫我建立一個搜尋任務來找這些公司</p>
              </div>
              <div className={styles.timestamp}>10:08 AM</div>
            </div>
          </div>
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
            />
            <button className={styles.sendBtn} title="發送" onClick={() => alert('訊息已發送（Demo）')}>
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
