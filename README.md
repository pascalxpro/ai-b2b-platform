# AI B2B 商業情報平台

> AI-powered B2B Intelligence and Lead Generation Platform

## 平台簡介
An AI-driven platform for B2B sales teams to discover leads, manage customers, track tasks, and make data-driven decisions.

## 功能模組
1. 🔍 搜尋中心 - AI智慧搜尋引擎
2. 📄 搜尋結果池 - 篩選、排序、匯出
3. 📊 Dashboard - KPI卡片、圖表、活動時間軸
4. 🏢 Workspace - 部門/團隊管理
5. 👥 客戶與商機 - Lead Score、狀態管理
6. ✅ 任務中心 - Kanban看板/列表
7. 🎙️ 會議智慧 - AI摘要、決策、行動項目
8. 📚 知識中心 - 文件、SOP、報告
9. 🤖 AI Business Partner - AI聊天助理
10. 🎯 決策中心 - AI洞察、待決策、歷程
11. 📈 報表分析 - AI產出報表、報表庫
12. ⚙️ 系統管理 - 使用者、Provider、設定

## 技術架構
- Next.js 16 (Turbopack)
- React 19
- TypeScript
- CSS Modules + CSS Custom Properties
- Recharts
- lucide-react
- HSL-based dynamic theming

## 設計系統
- Glassmorphism (backdrop-filter blur)
- Dynamic color palettes (6 presets + custom hue)
- Light/Dark theme switching
- Responsive mobile layout
- Page transition animations
- Loading skeleton components

## 快速開始
```bash
npm install
npm run dev
```
Open http://localhost:3000

## 專案結構
```text
src/
  app/           # Next.js App Router pages
  components/    # Reusable components
    layout/      # Sidebar, TopBar, MobileNav
    search/      # Search engine components
    theme/       # Theme palette picker
    ui/          # PageTransition, Skeleton, Breadcrumb
  hooks/         # Custom React hooks
  lib/           # Theme context, utilities
  styles/        # Global CSS, design tokens
```

## 路由總覽

| 路徑 (Route) | 描述 (Description) |
|---|---|
| `/` | Dashboard |
| `/search` | 搜尋中心 (Search Center) |
| `/results` | 搜尋結果池 (Search Results Pool) |
| `/workspace` | 團隊空間 (Workspace) |
| `/customers` | 客戶與商機 (Customers & Opportunities) |
| `/tasks` | 任務中心 (Task Center) |
| `/meetings` | 會議智慧 (Meeting Intelligence) |
| `/knowledge` | 知識中心 (Knowledge Center) |
| `/ai-partner` | AI 業務助理 (AI Business Partner) |
| `/decisions` | 決策中心 (Decision Center) |
| `/reports` | 報表分析 (Report Analysis) |
| `/settings` | 系統管理 (System Settings) |

## 主題設定
The dynamic theme system utilizes HSL (Hue, Saturation, Lightness) base hues to generate cohesive color palettes. It offers 6 predefined palette presets along with the ability to define a custom hue. The system supports seamless Light and Dark mode switching by manipulating CSS Custom Properties on the root element, and it persists the user's preferences locally using `localStorage`.

## License
MIT
