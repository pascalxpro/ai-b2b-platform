'use client';

import React, { useState } from 'react';
import { LogIn, Search, Database, AlertTriangle, Lightbulb } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import {
  LoginDiagram, AccountMenuDiagram, SearchCenterDiagram,
  BuilderDiagram, ResultsPoolDiagram, ConfidenceDiagram,
} from './diagrams';
import styles from './page.module.css';

type SectionId = 'login' | 'search' | 'results';

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'login', label: '帳號登入', icon: LogIn },
  { id: 'search', label: '搜尋中心', icon: Search },
  { id: 'results', label: '搜尋任務與結果池', icon: Database },
];

/** Numbered step whose number matches the badge in the accompanying diagram. */
function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <li className={styles.step}>
      <span className={styles.stepNum}>{n}</span>
      <div className={styles.stepBody}>
        <div className={styles.stepTitle}>{title}</div>
        {children && <div className={styles.stepText}>{children}</div>}
      </div>
    </li>
  );
}

function Note({ type = 'tip', children }: { type?: 'tip' | 'warn'; children: React.ReactNode }) {
  const Icon = type === 'warn' ? AlertTriangle : Lightbulb;
  return (
    <div className={type === 'warn' ? styles.warnBox : styles.tipBox}>
      <Icon size={16} className={styles.noteIcon} />
      <div>{children}</div>
    </div>
  );
}

function Figure({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <figure className={styles.figure}>
      <div className={styles.figureScroll}>{children}</div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}

export default function HelpPage() {
  const [active, setActive] = useState<SectionId>('login');

  return (
    <div className={styles.page}>
      <Breadcrumb items={[{ label: '使用說明' }]} />
      <div className={styles.header}>
        <h1 className={styles.title}>使用說明</h1>
        <p className={styles.subtitle}>目前涵蓋帳號登入、搜尋中心、搜尋任務與結果池三個核心功能</p>
      </div>

      <div className={styles.tabs}>
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              className={`${styles.tab} ${active === s.id ? styles.tabActive : ''}`}
              onClick={() => setActive(s.id)}
            >
              <Icon size={16} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ───────────── 帳號登入 ───────────── */}
      {active === 'login' && (
        <div className={styles.content}>
          <h2 className={styles.h2}>一、登入系統</h2>
          <p className={styles.lead}>
            本系統所有頁面都需要登入才能使用。未登入時直接開啟任何網址，都會自動被導向登入頁；
            登入成功後會回到您原本要去的那一頁。
          </p>

          <Figure caption="圖 1：登入頁的三個操作位置">
            <LoginDiagram />
          </Figure>

          <ol className={styles.steps}>
            <Step n={1} title="輸入電子郵件">
              使用管理員為您建立的帳號。若您還沒有帳號，請聯絡管理員在「系統管理 → 使用者管理」中新增。
            </Step>
            <Step n={2} title="輸入密碼">
              右側的眼睛圖示可切換顯示／隱藏密碼，確認沒有打錯字。
            </Step>
            <Step n={3} title="按下「登入」">
              登入後會停留 7 天，期間不需重新登入。Google／Microsoft 登入目前尚未開放。
            </Step>
          </ol>

          <Note type="warn">
            <strong>登入失敗時</strong>，畫面上方會顯示紅色訊息。若顯示「帳號或密碼錯誤」，
            請確認信箱大小寫；若顯示「帳號已停用」，代表管理員已將此帳號停用，需請管理員重新啟用。
          </Note>

          <h2 className={styles.h2}>二、確認登入身分與登出</h2>
          <p className={styles.lead}>
            登入後，右上角的圓形頭像就是您的帳號選單，可以確認目前登入的是哪一個帳號。
          </p>

          <Figure caption="圖 2：右上角帳號選單">
            <AccountMenuDiagram />
          </Figure>

          <ol className={styles.steps}>
            <Step n={1} title="點擊右上角頭像">
              展開帳號選單，會顯示您的姓名與電子郵件。若您是管理員，姓名旁會有「管理員」標籤。
            </Step>
            <Step n={2} title="「系統設定」（僅管理員可見）">
              一般使用者不會看到這個選項。管理員可由此進入使用者管理、搜尋引擎設定、AI 服務配置。
            </Step>
            <Step n={3} title="「登出」">
              點擊後會清除登入狀態並回到登入頁。共用電腦請務必登出。
            </Step>
          </ol>

          <Note>
            忘記密碼目前無法自行重設，請聯絡管理員在「系統管理 → 使用者管理」中，
            編輯您的帳號並填入新密碼（至少 8 碼）。
          </Note>
        </div>
      )}

      {/* ───────────── 搜尋中心 ───────────── */}
      {active === 'search' && (
        <div className={styles.content}>
          <h2 className={styles.h2}>一、兩種搜尋方式</h2>
          <p className={styles.lead}>
            搜尋中心是系統首頁。這裡有兩種啟動搜尋的方式，差別在於能不能設定條件。
          </p>

          <Figure caption="圖 3：快速搜尋與完整搜尋的差別">
            <SearchCenterDiagram />
          </Figure>

          <ol className={styles.steps}>
            <Step n={1} title="快速搜尋：輸入文字後按「搜尋」">
              直接建立任務並立刻開始抓取，目標數量固定為 50 筆，不會經過條件設定。
              適合快速確認某個方向有沒有東西。
            </Step>
            <Step n={2} title="完整搜尋：把輸入框留空，直接按「搜尋」">
              會開啟「建立搜尋任務」視窗，可以指定國家、產業、公司類型與數量。
              正式蒐集名單建議走這一種。下方「快速開始」區的
              <strong>全球搜尋</strong>、<strong>產業分析</strong> 卡片也會開啟同一個視窗。
            </Step>
          </ol>

          <h2 className={styles.h2}>二、建立搜尋任務（完整條件設定）</h2>

          <Figure caption="圖 4：建立搜尋任務視窗的各欄位">
            <BuilderDiagram />
          </Figure>

          <ol className={styles.steps}>
            <Step n={1} title="快速載入已儲存條件">
              若之前存過條件，可從這裡一鍵帶入，不用重填。選取後右上角會出現「刪除」可移除該筆。
            </Step>
            <Step n={2} title="確認 AI 金鑰狀態">
              若顯示綠色「使用您自己的 Gemini 金鑰」表示已設定完成。若顯示黃色警告，
              請點「設定金鑰」貼上自己的 Gemini 金鑰，否則 AI 翻譯與優化無法使用
              （一般搜尋不受影響）。
            </Step>
            <Step n={3} title="AI 翻譯（選用，但強烈建議）">
              在左邊輸入中文，選擇目標語言，按「AI 翻譯」。
              用當地語言搜尋，找到的在地廠商會比用中文搜尋多很多。
            </Step>
            <Step n={4} title="自然語言描述">
              翻譯結果會導入這裡，也可以直接手動編輯。這是搜尋的主要語句。
            </Step>
            <Step n={5} title="目標國家">
              輸入後按 Enter，或點下方「快速選擇國家」的按鈕。
              選定國家後，系統會顯示該國的熱門產業建議，點一下即可加入。
            </Step>
            <Step n={6} title="公司類型與目標客戶類型">
              勾選您要找的對象性質。「目標客戶類型」是指這些廠商主要供貨給誰，
              有助於篩掉性質不符的公司。
            </Step>
            <Step n={7} title="關鍵字與目標數量">
              關鍵字建議直接填<strong>目標語言</strong>（此欄位不會自動翻譯）。
              目標數量可調 10～500 筆。
            </Step>
            <Step n={8} title="開始搜尋">
              有選國家時，按鈕會變成「✨ AI 優化並搜尋」，會先把條件轉成當地商業用語再搜尋，
              並顯示預覽讓您確認。沒選國家時則是「開始搜尋」，直接執行。
              「儲存條件」可把目前設定存起來重複使用。
            </Step>
          </ol>

          <Note type="warn">
            AI 優化偶爾會出現 <code>high demand</code> 之類的錯誤，那是 Google 伺服器忙碌，
            與您的設定無關。可以按「跳過優化，直接搜尋」，或等一兩分鐘再試。
          </Note>

          <Note>
            搜尋執行需要一些時間（視目標數量而定）。完成後會自動跳到該任務的結果頁。
            首頁下方的「最近搜尋紀錄」也可以隨時點回去看。
          </Note>
        </div>
      )}

      {/* ───────────── 結果池 ───────────── */}
      {active === 'results' && (
        <div className={styles.content}>
          <h2 className={styles.h2}>一、結果池的操作區域</h2>
          <p className={styles.lead}>
            搜尋完成的公司都會收進結果池。這裡是篩選、檢視、標記與匯出的地方。
          </p>

          <Figure caption="圖 5：搜尋結果池的七個操作區域">
            <ResultsPoolDiagram />
          </Figure>

          <ol className={styles.steps}>
            <Step n={1} title="任務資訊列">
              顯示目前檢視的是哪一次搜尋任務、狀態與進度。
            </Step>
            <Step n={2} title="狀態篩選與搜尋">
              可依<strong>新進／有效／待確認／重複／無效</strong>篩選，
              也能指定國家，或在結果中用關鍵字再搜尋一次。
            </Step>
            <Step n={3} title="排序、檢視切換與匯出">
              可依品質分數或公司名稱排序，切換表格／卡片檢視。
              「匯出」會下載目前篩選結果的 CSV（含國別信心、網站、Email、電話等欄位）。
            </Step>
            <Step n={4} title="國別信心提示列">
              當有結果的國別無法由網域確認時會出現，可快速只看「已驗證」或「未驗證」的項目。
            </Step>
            <Step n={5} title="結果列表">
              公司名稱可直接點擊開啟該公司網站。國家欄位旁的標籤代表國別可信度。
            </Step>
            <Step n={6} title="單筆操作">
              <strong>✎ 編輯</strong>可直接修改公司名稱、國家、產業、類型；
              <strong>👁 檢視</strong>會開啟右側詳細面板，可補充 Email、電話、備註。
            </Step>
            <Step n={7} title="批次操作">
              勾選多筆後，畫面底部會浮出批次列，可一次標記有效／無效或加入收藏。
            </Step>
          </ol>

          <h2 className={styles.h2}>二、看懂「國別信心」</h2>
          <p className={styles.lead}>
            這是本系統為了解決「搜日本卻混進其他國家廠商」而做的判斷機制，
            是篩選名單時最重要的參考。
          </p>

          <Figure caption="圖 6：國別信心的判定流程">
            <ConfidenceDiagram />
          </Figure>

          <div className={styles.badgeTable}>
            <div className={styles.badgeRow}>
              <span className={styles.badgeOk}>已驗證</span>
              <span>網域結尾符合目標國家（如 .jp／.co.jp），或抓到的聯絡電話國碼相符。國別可信。</span>
            </div>
            <div className={styles.badgeRow}>
              <span className={styles.badgeWarn}>未驗證</span>
              <span>
                使用 .com／.net／.org 這類通用網域，無法從網域判斷國別。
                <strong>不代表是錯的</strong>——很多在地廠商為了國際化也用 .com，
                所以系統保留它們，但建議您人工確認。
              </span>
            </div>
          </div>

          <Note>
            系統會進一步抓取「未驗證」網站上的聯絡電話，用國碼（如 +81 日本、+886 台灣）再判斷一次。
            若電話明確顯示是其他國家，該筆會自動標記為「無效」；抓不到電話則維持原狀，不會誤判。
          </Note>

          <h2 className={styles.h2}>三、品質分數怎麼算</h2>
          <p className={styles.lead}>
            分數範圍 20～100，用來排序哪些結果比較值得先看。計分依據包含：
          </p>
          <ul className={styles.bullets}>
            <li>是否有具體的公司名稱（不只是網域名稱）</li>
            <li>是否有標題與描述文字</li>
            <li>網域國別是否符合目標國家</li>
            <li>搜尋關鍵字是否出現在標題或描述中</li>
            <li>電話國碼是否確認為目標國家（額外加分）</li>
          </ul>

          <Note type="warn">
            分數高低是<strong>相對參考</strong>，不代表商業價值。
            分數低通常只是資料不完整，仍可能是好客戶，建議搭配國別信心一起看。
          </Note>

          <h2 className={styles.h2}>四、建議的整理流程</h2>
          <ol className={styles.steps}>
            <Step n={1} title="先看「已驗證」的項目">
              用國別信心篩選器切到「已驗證」，這批國別最可信，優先處理。
            </Step>
            <Step n={2} title="逐筆檢視並補充資料">
              點 👁 開啟詳細面板，確認是否為目標客戶，補上 Email、電話與備註。
            </Step>
            <Step n={3} title="標記有效／無效">
              確認可用的標「有效」，不相關的標「無效」。之後就能用狀態篩選只看有效名單。
            </Step>
            <Step n={4} title="再處理「未驗證」的項目">
              這批需要人工開啟網站確認。確認後同樣標記，讓名單逐步收斂。
            </Step>
            <Step n={5} title="匯出">
              篩選到只剩「有效」後按「匯出」，得到乾淨的 CSV 名單。
            </Step>
          </ol>
        </div>
      )}
    </div>
  );
}
