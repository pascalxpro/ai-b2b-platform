'use client';

import React from 'react';

/**
 * Inline SVG illustrations for the help pages.
 *
 * Deliberately schematic diagrams rather than screenshots: screenshots of this
 * app would go stale on the next UI change (and several already have during
 * development), whereas these show the layout and flow, which are what the
 * instructions actually depend on. They use currentColor and CSS variables so
 * they follow the active theme instead of baking in one palette.
 */

const C = {
  line: 'var(--color-border)',
  faint: 'var(--color-surface-alt)',
  text: 'var(--color-text)',
  muted: 'var(--color-text-muted)',
  primary: 'var(--color-primary)',
  ok: '#22c55e',
  warn: '#f59e0b',
  danger: '#ef4444',
};

function Frame({ children, viewBox = '0 0 560 300' }: { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} role="img" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {children}
    </svg>
  );
}

/** Step badge: a numbered circle used to tie a diagram region to a written step. */
function Step({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="11" fill={C.primary} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{n}</text>
    </g>
  );
}

// ─── Login ───
export function LoginDiagram() {
  return (
    <Frame viewBox="0 0 560 300">
      <title>登入畫面各欄位位置</title>
      {/* card */}
      <rect x="160" y="20" width="240" height="260" rx="14" fill={C.faint} stroke={C.line} />
      {/* logo */}
      <rect x="266" y="42" width="28" height="28" rx="8" fill={C.primary} />
      <text x="280" y="92" textAnchor="middle" fontSize="15" fontWeight="700" fill={C.text}>AI B2B</text>
      <text x="280" y="108" textAnchor="middle" fontSize="10" fill={C.muted}>商業情報平台</text>

      {/* email field */}
      <rect x="186" y="126" width="188" height="30" rx="7" fill="var(--color-surface)" stroke={C.line} />
      <circle cx="200" cy="141" r="5" fill="none" stroke={C.muted} strokeWidth="1.4" />
      <text x="214" y="145" fontSize="10" fill={C.muted}>電子郵件</text>
      <Step x={168} y={141} n={1} />

      {/* password field */}
      <rect x="186" y="164" width="188" height="30" rx="7" fill="var(--color-surface)" stroke={C.line} />
      <rect x="196" y="136" width="0" height="0" />
      <rect x="196" y="175" width="8" height="8" rx="2" fill="none" stroke={C.muted} strokeWidth="1.4" />
      <text x="214" y="183" fontSize="10" fill={C.muted}>密碼</text>
      {/* eye toggle */}
      <circle cx="360" cy="179" r="5" fill="none" stroke={C.primary} strokeWidth="1.4" />
      <Step x={168} y={179} n={2} />

      {/* submit */}
      <rect x="186" y="206" width="188" height="30" rx="7" fill={C.primary} />
      <text x="280" y="226" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">登入</text>
      <Step x={168} y={221} n={3} />

      <text x="280" y="258" textAnchor="middle" fontSize="9" fill={C.muted}>Google / Microsoft 登入（即將開放）</text>
    </Frame>
  );
}

export function AccountMenuDiagram() {
  return (
    <Frame viewBox="0 0 560 240">
      <title>右上角帳號選單</title>
      {/* topbar */}
      <rect x="20" y="20" width="520" height="40" rx="8" fill={C.faint} stroke={C.line} />
      <circle cx="510" cy="40" r="13" fill={C.primary} />
      <text x="510" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">A</text>
      <Step x={510} y={12} n={1} />

      {/* dropdown */}
      <rect x="330" y="70" width="210" height="150" rx="10" fill="var(--color-surface)" stroke={C.line} />
      {/* header */}
      <circle cx="356" cy="96" r="13" fill={C.primary} />
      <text x="356" y="101" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">A</text>
      <text x="378" y="93" fontSize="11" fontWeight="600" fill={C.text}>Admin</text>
      <rect x="424" y="84" width="42" height="13" rx="6" fill="var(--color-primary-subtle)" />
      <text x="445" y="94" textAnchor="middle" fontSize="8" fill={C.primary}>管理員</text>
      <text x="378" y="107" fontSize="9" fill={C.muted}>admin@b2b.com</text>
      <line x1="340" y1="120" x2="530" y2="120" stroke={C.line} />

      <text x="348" y="142" fontSize="10" fill={C.text}>⚙️  系統設定</text>
      <text x="330" y="142" fontSize="9" fill={C.muted}></text>
      <Step x={310} y={138} n={2} />
      <text x="452" y="142" fontSize="8" fill={C.muted}>(僅管理員)</text>

      <line x1="340" y1="156" x2="530" y2="156" stroke={C.line} />
      <text x="348" y="180" fontSize="10" fill={C.danger}>🚪  登出</text>
      <Step x={310} y={176} n={3} />
      <text x="348" y="202" fontSize="8" fill={C.muted}>登出後回到登入頁</text>
    </Frame>
  );
}

// ─── Search Center ───
export function SearchCenterDiagram() {
  return (
    <Frame viewBox="0 0 560 300">
      <title>搜尋中心的兩種搜尋入口</title>
      <text x="280" y="28" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.text}>智能商業搜尋引擎</text>

      {/* search bar */}
      <rect x="90" y="46" width="380" height="40" rx="20" fill="var(--color-surface)" stroke={C.line} strokeWidth="1.5" />
      <circle cx="114" cy="66" r="6" fill="none" stroke={C.muted} strokeWidth="1.5" />
      <text x="130" y="70" fontSize="10" fill={C.muted}>例如：找日本具食品包裝需求的代理商...</text>
      <rect x="386" y="53" width="76" height="26" rx="13" fill={C.primary} />
      <text x="424" y="70" textAnchor="middle" fontSize="10" fontWeight="600" fill="#fff">搜尋</text>

      {/* two paths */}
      <path d="M 200 92 L 200 128" stroke={C.ok} strokeWidth="1.6" fill="none" markerEnd="url(#ah-ok)" />
      <path d="M 400 92 L 400 128" stroke={C.warn} strokeWidth="1.6" fill="none" markerEnd="url(#ah-warn)" />
      <defs>
        <marker id="ah-ok" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.ok} />
        </marker>
        <marker id="ah-warn" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.warn} />
        </marker>
      </defs>

      {/* path A */}
      <rect x="70" y="132" width="200" height="86" rx="10" fill={C.faint} stroke={C.ok} />
      <Step x={88} y={150} n={1} />
      <text x="106" y="154" fontSize="10" fontWeight="600" fill={C.text}>輸入文字後按搜尋</text>
      <text x="86" y="174" fontSize="9" fill={C.muted}>→ 立即建立任務並開始搜尋</text>
      <text x="86" y="190" fontSize="9" fill={C.muted}>→ 目標數量固定 50 筆</text>
      <text x="86" y="206" fontSize="9" fill={C.ok}>適合：快速試搜</text>

      {/* path B */}
      <rect x="292" y="132" width="200" height="86" rx="10" fill={C.faint} stroke={C.warn} />
      <Step x={310} y={150} n={2} />
      <text x="328" y="154" fontSize="10" fontWeight="600" fill={C.text}>留空直接按搜尋</text>
      <text x="308" y="174" fontSize="9" fill={C.muted}>→ 開啟「建立搜尋任務」視窗</text>
      <text x="308" y="190" fontSize="9" fill={C.muted}>→ 可設定國家／產業／數量</text>
      <text x="308" y="206" fontSize="9" fill={C.warn}>適合：正式蒐集名單</text>

      <text x="280" y="248" textAnchor="middle" fontSize="9" fill={C.muted}>
        下方「快速開始」的「全球搜尋」「產業分析」卡片也會開啟同一個視窗
      </text>
      <text x="280" y="272" textAnchor="middle" fontSize="9" fill={C.muted}>
        「最近搜尋紀錄」點任一列可回到該次任務的結果
      </text>
    </Frame>
  );
}

export function BuilderDiagram() {
  return (
    <Frame viewBox="0 0 560 400">
      <title>建立搜尋任務視窗的欄位</title>
      <rect x="30" y="14" width="500" height="374" rx="12" fill={C.faint} stroke={C.line} />
      <text x="52" y="42" fontSize="13" fontWeight="700" fill={C.text}>建立搜尋任務</text>

      {/* saved */}
      <rect x="52" y="56" width="456" height="26" rx="6" fill="var(--color-surface)" stroke={C.line} />
      <text x="64" y="73" fontSize="9" fill={C.muted}>快速載入已儲存條件 ▾</text>
      <Step x={38} y={69} n={1} />

      {/* key bar */}
      <rect x="52" y="90" width="456" height="24" rx="6" fill="rgba(34,197,94,0.08)" stroke={C.ok} />
      <text x="64" y="106" fontSize="9" fill={C.text}>🔑 AI 使用您自己的 Gemini 金鑰（存在本機瀏覽器）</text>
      <rect x="440" y="95" width="58" height="15" rx="7" fill="none" stroke={C.primary} />
      <text x="469" y="106" textAnchor="middle" fontSize="8" fill={C.primary}>管理金鑰</text>
      <Step x={38} y={102} n={2} />

      {/* translate row */}
      <rect x="52" y="122" width="300" height="26" rx="6" fill="var(--color-surface)" stroke={C.line} />
      <text x="64" y="139" fontSize="9" fill={C.muted}>輸入中文，AI 翻譯成目標語言</text>
      <rect x="358" y="122" width="66" height="26" rx="6" fill="var(--color-surface)" stroke={C.line} />
      <text x="391" y="139" textAnchor="middle" fontSize="9" fill={C.text}>JP 日文</text>
      <rect x="430" y="122" width="78" height="26" rx="6" fill={C.primary} />
      <text x="469" y="139" textAnchor="middle" fontSize="9" fontWeight="600" fill="#fff">AI 翻譯</text>
      <Step x={38} y={135} n={3} />

      {/* description */}
      <rect x="52" y="156" width="456" height="38" rx="6" fill="var(--color-surface)" stroke={C.line} />
      <text x="64" y="179" fontSize="9" fill={C.muted}>描述您想尋找的目標企業…（翻譯結果導入此處）</text>
      <Step x={38} y={175} n={4} />

      {/* country + industry */}
      <rect x="52" y="204" width="222" height="30" rx="6" fill="var(--color-surface)" stroke={C.line} />
      <rect x="62" y="212" width="44" height="15" rx="7" fill="var(--color-primary-subtle)" />
      <text x="84" y="223" textAnchor="middle" fontSize="8" fill={C.primary}>日本 ✕</text>
      <text x="120" y="223" fontSize="8" fill={C.muted}>目標國家</text>
      <Step x={38} y={219} n={5} />

      <rect x="286" y="204" width="222" height="30" rx="6" fill="var(--color-surface)" stroke={C.line} />
      <text x="298" y="223" fontSize="8" fill={C.muted}>產業別（輸入後按 Enter）</text>

      {/* company types */}
      <text x="52" y="254" fontSize="9" fontWeight="600" fill={C.text}>公司類型</text>
      {['製造商', '代理商', '經銷商', '進口商', '批發商'].map((t, i) => (
        <g key={t}>
          <rect x={52 + i * 92} y={262} width="10" height="10" rx="2" fill={i > 0 ? C.primary : 'none'} stroke={i > 0 ? C.primary : C.muted} />
          <text x={68 + i * 92} y={271} fontSize="8" fill={C.text}>{t}</text>
        </g>
      ))}
      <Step x={38} y={267} n={6} />

      {/* keywords + target */}
      <rect x="52" y="288" width="280" height="28" rx="6" fill="var(--color-surface)" stroke={C.line} />
      <text x="64" y="306" fontSize="8" fill={C.muted}>關鍵字（建議填目標語言，按 Enter 新增）</text>
      <Step x={38} y={302} n={7} />

      <text x="346" y="298" fontSize="8" fill={C.muted}>目標數量</text>
      <line x1="346" y1="308" x2="470" y2="308" stroke={C.line} strokeWidth="3" strokeLinecap="round" />
      <line x1="346" y1="308" x2="410" y2="308" stroke={C.primary} strokeWidth="3" strokeLinecap="round" />
      <circle cx="410" cy="308" r="5" fill={C.primary} />
      <rect x="478" y="296" width="30" height="20" rx="5" fill="var(--color-surface)" stroke={C.line} />
      <text x="493" y="310" textAnchor="middle" fontSize="8" fill={C.text}>110</text>

      {/* actions */}
      <rect x="330" y="336" width="60" height="26" rx="6" fill="none" stroke={C.line} />
      <text x="360" y="353" textAnchor="middle" fontSize="9" fill={C.muted}>儲存條件</text>
      <rect x="398" y="336" width="110" height="26" rx="6" fill={C.primary} />
      <text x="453" y="353" textAnchor="middle" fontSize="9" fontWeight="600" fill="#fff">✨ AI 優化並搜尋</text>
      <Step x={316} y={349} n={8} />
      <text x="52" y="378" fontSize="8" fill={C.muted}>※ 未選國家時，按鈕文字為「開始搜尋」，不經過 AI 優化</text>
    </Frame>
  );
}

// ─── Results pool ───
export function ResultsPoolDiagram() {
  return (
    <Frame viewBox="0 0 560 380">
      <title>搜尋結果池的操作區域</title>
      {/* task bar */}
      <rect x="24" y="14" width="512" height="34" rx="8" fill="var(--color-primary-subtle)" />
      <text x="40" y="35" fontSize="9" fontWeight="600" fill={C.text}>目標任務：日本食品容器代理店…</text>
      <rect x="330" y="22" width="40" height="16" rx="8" fill={C.ok} opacity="0.2" />
      <text x="350" y="34" textAnchor="middle" fontSize="8" fill={C.ok}>已完成</text>
      <line x1="386" y1="31" x2="486" y2="31" stroke={C.line} strokeWidth="4" strokeLinecap="round" />
      <line x1="386" y1="31" x2="466" y2="31" stroke={C.primary} strokeWidth="4" strokeLinecap="round" />
      <text x="500" y="34" fontSize="8" fill={C.muted}>24/50</text>
      {/* Left of the bar rather than above it: at y=8 the r=11 badge extended
          to y=-3 and was clipped by the viewBox. */}
      <Step x={12} y={31} n={1} />

      {/* filters */}
      <rect x="24" y="56" width="512" height="58" rx="8" fill={C.faint} stroke={C.line} />
      {['全部', '新進', '有效', '待確認', '重複', '無效'].map((t, i) => (
        <g key={t}>
          <rect x={38 + i * 52} y={66} width="46" height="18" rx="9" fill={i === 0 ? C.primary : 'none'} stroke={i === 0 ? C.primary : C.line} />
          <text x={61 + i * 52} y={79} textAnchor="middle" fontSize="8" fill={i === 0 ? '#fff' : C.muted}>{t}</text>
        </g>
      ))}
      <rect x="356" y="66" width="76" height="18" rx="5" fill="var(--color-surface)" stroke={C.line} />
      <text x="394" y="79" textAnchor="middle" fontSize="8" fill={C.muted}>所有國家 ▾</text>
      <rect x="440" y="66" width="86" height="18" rx="5" fill="var(--color-surface)" stroke={C.line} />
      <text x="483" y="79" textAnchor="middle" fontSize="8" fill={C.muted}>在結果中搜尋</text>
      <Step x={30} y={75} n={2} />

      <rect x="38" y="90" width="96" height="18" rx="5" fill="var(--color-surface)" stroke={C.line} />
      <text x="86" y="103" textAnchor="middle" fontSize="8" fill={C.muted}>品質分數 高→低 ▾</text>
      <rect x="142" y="90" width="42" height="18" rx="5" fill="var(--color-surface)" stroke={C.line} />
      <text x="163" y="103" textAnchor="middle" fontSize="8" fill={C.muted}>檢視</text>
      <rect x="192" y="90" width="48" height="18" rx="5" fill="var(--color-surface)" stroke={C.line} />
      <text x="216" y="103" textAnchor="middle" fontSize="8" fill={C.muted}>匯出</text>
      <Step x={30} y={99} n={3} />

      {/* confidence banner */}
      <rect x="24" y="122" width="512" height="26" rx="8" fill="rgba(245,158,11,0.09)" stroke={C.warn} />
      <text x="40" y="139" fontSize="8" fill={C.text}>⚠️ 有 14 筆使用通用網域（.com/.net/.org），國別無法由網域確認</text>
      <rect x="400" y="128" width="40" height="14" rx="7" fill={C.primary} />
      <text x="420" y="138" textAnchor="middle" fontSize="7" fill="#fff">全部</text>
      <rect x="444" y="128" width="44" height="14" rx="7" fill="none" stroke={C.line} />
      <text x="466" y="138" textAnchor="middle" fontSize="7" fill={C.muted}>已驗證</text>
      <rect x="492" y="128" width="44" height="14" rx="7" fill="none" stroke={C.line} />
      <text x="514" y="138" textAnchor="middle" fontSize="7" fill={C.muted}>未驗證</text>
      <Step x={30} y={135} n={4} />

      {/* table header */}
      <rect x="24" y="156" width="512" height="22" rx="4" fill={C.faint} />
      {[['公司名稱', 56], ['國家', 200], ['產業', 262], ['類型', 316], ['來源', 366], ['分數', 414], ['狀態', 458], ['操作', 500]].map(([t, x]) => (
        <text key={t as string} x={x as number} y={171} fontSize="8" fontWeight="600" fill={C.muted}>{t as string}</text>
      ))}

      {/* rows */}
      {[0, 1, 2].map(i => (
        <g key={i}>
          <line x1="24" y1={200 + i * 32} x2="536" y2={200 + i * 32} stroke={C.line} />
          <rect x="34" y={186 + i * 32} width="9" height="9" rx="2" fill="none" stroke={C.muted} />
          <text x="56" y={194 + i * 32} fontSize="8" fill={C.text}>냅킨코리아</text>
          <text x="200" y={194 + i * 32} fontSize="8" fill={C.text}>韓國</text>
          <rect x="226" y={186 + i * 32} width="30" height="12" rx="6" fill="none" stroke={i === 2 ? C.warn : C.ok} />
          <text x="241" y={195 + i * 32} textAnchor="middle" fontSize="6" fill={i === 2 ? C.warn : C.ok}>
            {i === 2 ? '未驗證' : '已驗證'}
          </text>
          <text x="262" y={194 + i * 32} fontSize="8" fill={C.muted}>未知產業</text>
          <text x="316" y={194 + i * 32} fontSize="8" fill={C.muted}>未知類型</text>
          <text x="366" y={194 + i * 32} fontSize="8" fill={C.muted}>Serper</text>
          <line x1="410" y1={191 + i * 32} x2="446" y2={191 + i * 32} stroke={C.ok} strokeWidth="3" strokeLinecap="round" />
          <text x="452" y={194 + i * 32} fontSize="8" fill={C.text}>90</text>
          <rect x="470" y={185 + i * 32} width="26" height="13" rx="6" fill="var(--color-info-bg, rgba(24,144,255,0.12))" />
          <text x="483" y={195 + i * 32} textAnchor="middle" fontSize="6" fill={C.primary}>新進</text>
          <text x="506" y={195 + i * 32} fontSize="9" fill={C.muted}>✎</text>
          <text x="522" y={195 + i * 32} fontSize="9" fill={C.muted}>👁</text>
        </g>
      ))}
      <Step x={30} y={190} n={5} />
      <Step x={548} y={190} n={6} />

      {/* batch bar */}
      <rect x="140" y="292" width="280" height="30" rx="15" fill="var(--color-surface)" stroke={C.primary} />
      <text x="160" y="311" fontSize="8" fill={C.text}>已選取 3 筆</text>
      <text x="224" y="311" fontSize="8" fill={C.ok}>✓ 標記有效</text>
      <text x="288" y="311" fontSize="8" fill={C.danger}>✕ 標記無效</text>
      <text x="352" y="311" fontSize="8" fill={C.warn}>★ 收藏</text>
      <Step x={130} y={307} n={7} />

      <text x="280" y="348" textAnchor="middle" fontSize="8" fill={C.muted}>勾選任一列後，批次操作列會浮現在畫面底部</text>
      <text x="280" y="366" textAnchor="middle" fontSize="8" fill={C.muted}>分頁可選 20 / 50 / 100 筆一頁</text>
    </Frame>
  );
}

export function ConfidenceDiagram() {
  return (
    <Frame viewBox="0 0 560 250">
      <title>國別信心如何判定</title>
      <rect x="200" y="14" width="160" height="30" rx="8" fill={C.faint} stroke={C.line} />
      <text x="280" y="34" textAnchor="middle" fontSize="10" fontWeight="600" fill={C.text}>搜尋引擎回傳一筆結果</text>

      <path d="M 280 46 L 280 66" stroke={C.line} strokeWidth="1.4" markerEnd="url(#ah-n)" />
      <defs>
        <marker id="ah-n" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.line} />
        </marker>
      </defs>

      <rect x="176" y="68" width="208" height="30" rx="8" fill={C.faint} stroke={C.line} />
      <text x="280" y="88" textAnchor="middle" fontSize="10" fill={C.text}>網域結尾是目標國家嗎？</text>

      {/* yes */}
      <path d="M 200 98 L 120 132" stroke={C.ok} strokeWidth="1.4" markerEnd="url(#ah-ok2)" />
      <defs>
        <marker id="ah-ok2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.ok} />
        </marker>
      </defs>
      <text x="140" y="112" fontSize="8" fill={C.ok}>是 (.jp/.co.jp)</text>
      <rect x="24" y="134" width="180" height="46" rx="8" fill="rgba(34,197,94,0.08)" stroke={C.ok} />
      <text x="114" y="152" textAnchor="middle" fontSize="10" fontWeight="600" fill={C.ok}>已驗證</text>
      <text x="114" y="168" textAnchor="middle" fontSize="8" fill={C.muted}>國別可信，直接使用</text>

      {/* no */}
      <path d="M 360 98 L 440 132" stroke={C.warn} strokeWidth="1.4" markerEnd="url(#ah-w2)" />
      <defs>
        <marker id="ah-w2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.warn} />
        </marker>
      </defs>
      <text x="400" y="112" fontSize="8" fill={C.warn}>否 (.com/.net)</text>
      <rect x="356" y="134" width="180" height="46" rx="8" fill="rgba(245,158,11,0.09)" stroke={C.warn} />
      <text x="446" y="152" textAnchor="middle" fontSize="10" fontWeight="600" fill={C.warn}>未驗證</text>
      <text x="446" y="168" textAnchor="middle" fontSize="8" fill={C.muted}>保留，但建議人工複核</text>

      <text x="280" y="212" textAnchor="middle" fontSize="9" fill={C.muted}>
        系統會進一步抓取「未驗證」網站的聯絡電話，用國碼(+81/+886)再判斷一次
      </text>
      <text x="280" y="232" textAnchor="middle" fontSize="9" fill={C.danger}>
        若電話顯示是別的國家 → 自動標記為「無效」
      </text>
    </Frame>
  );
}

// ─── Opportunity pool (multi-account) ───
export function OpportunityPoolDiagram() {
  return (
    <Frame viewBox="0 0 560 290">
      <title>結果池與商機池之間的釋放與認領流程</title>
      <defs>
        <marker id="ah-rel" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.warn} />
        </marker>
        <marker id="ah-clm" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.ok} />
        </marker>
        <marker id="ah-wd" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={C.muted} />
        </marker>
      </defs>

      {/* Account A's private pool */}
      <rect x="14" y="34" width="150" height="96" rx="10" fill={C.faint} stroke={C.line} />
      <text x="89" y="56" textAnchor="middle" fontSize="10" fontWeight="700" fill={C.text}>A 帳號的結果池</text>
      <text x="89" y="74" textAnchor="middle" fontSize="8" fill={C.muted}>只有 A 看得到</text>
      <rect x="30" y="84" width="118" height="16" rx="4" fill="var(--color-surface)" stroke={C.line} />
      <rect x="30" y="104" width="118" height="16" rx="4" fill="var(--color-surface)" stroke={C.line} />

      {/* shared pool */}
      <rect x="200" y="24" width="160" height="116" rx="10" fill="rgba(245,158,11,0.09)" stroke={C.warn} />
      <text x="280" y="46" textAnchor="middle" fontSize="10" fontWeight="700" fill={C.warn}>商機池</text>
      <text x="280" y="63" textAnchor="middle" fontSize="8" fill={C.muted}>所有帳號都看得到</text>
      <rect x="216" y="74" width="128" height="18" rx="4" fill="var(--color-surface)" stroke={C.warn} />
      <text x="280" y="87" textAnchor="middle" fontSize="8" fill={C.muted}>待認領・釋放者：A</text>
      <text x="280" y="118" textAnchor="middle" fontSize="8" fill={C.muted}>可編輯權仍在 A 手上</text>

      {/* Account B's private pool */}
      <rect x="396" y="34" width="150" height="96" rx="10" fill={C.faint} stroke={C.line} />
      <text x="471" y="56" textAnchor="middle" fontSize="10" fontWeight="700" fill={C.text}>B 帳號的結果池</text>
      <text x="471" y="74" textAnchor="middle" fontSize="8" fill={C.muted}>認領後歸 B 所有</text>
      <rect x="412" y="84" width="118" height="16" rx="4" fill="var(--color-surface)" stroke={C.ok} />
      <text x="471" y="96" textAnchor="middle" fontSize="7" fill={C.muted}>認領自 A</text>

      {/* release A → pool */}
      <path d="M 166 68 L 196 68" stroke={C.warn} strokeWidth="1.6" markerEnd="url(#ah-rel)" />
      <text x="181" y="60" textAnchor="middle" fontSize="8" fontWeight="600" fill={C.warn}>釋放</text>

      {/* withdraw pool → A */}
      <path d="M 196 106 L 166 106" stroke={C.muted} strokeWidth="1.4" strokeDasharray="3 3" markerEnd="url(#ah-wd)" />
      <text x="181" y="122" textAnchor="middle" fontSize="8" fill={C.muted}>收回</text>

      {/* claim pool → B */}
      <path d="M 364 82 L 392 82" stroke={C.ok} strokeWidth="1.6" markerEnd="url(#ah-clm)" />
      <text x="378" y="74" textAnchor="middle" fontSize="8" fontWeight="600" fill={C.ok}>認領</text>

      {/* audit trail */}
      <rect x="90" y="176" width="380" height="58" rx="10" fill={C.faint} stroke={C.line} />
      <text x="280" y="197" textAnchor="middle" fontSize="10" fontWeight="600" fill={C.text}>每一筆都留下軌跡</text>
      <text x="280" y="215" textAnchor="middle" fontSize="8" fill={C.muted}>釋放者：A　｜　釋放時間　｜　認領者：B　｜　認領時間</text>
      <text x="280" y="229" textAnchor="middle" fontSize="8" fill={C.muted}>轉換狀態自動變成「已指派」，方便後續追蹤</text>

      <text x="280" y="262" textAnchor="middle" fontSize="9" fill={C.danger}>
        同一筆若兩人同時按「認領」，只有先到的一人會成功
      </text>
      <text x="280" y="278" textAnchor="middle" fontSize="8" fill={C.muted}>
        另一人會看到「已被其他人先行認領」提示
      </text>
    </Frame>
  );
}
