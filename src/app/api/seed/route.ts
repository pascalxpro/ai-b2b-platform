export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST() {
  try {
    console.log('Starting seed via API...')

    // 1. Users
    const usersData = [
      { email: 'admin@company.com', name: '系統管理員', status: 'ACTIVE' as const, paletteId: 'amethyst' },
      { email: 'wang@company.com', name: '王小明', status: 'ACTIVE' as const, paletteId: 'blue' },
      { email: 'lee@company.com', name: '李美玲', status: 'ACTIVE' as const, paletteId: 'green' },
      { email: 'chen@company.com', name: '陳志豪', status: 'ACTIVE' as const, paletteId: 'orange' },
      { email: 'lin@company.com', name: '林雅婷', status: 'ACTIVE' as const, paletteId: 'pink' },
    ]

    const users: Record<string, any> = {}
    for (const uData of usersData) {
      let user = await prisma.user.findUnique({ where: { email: uData.email } })
      if (!user) {
        user = await prisma.user.create({ data: uData })
      }
      users[uData.email] = user
    }

    // 2. Workspaces
    const wsData = [
      { name: '營一部', type: 'DEPARTMENT', sortOrder: 1 },
      { name: '營二部', type: 'DEPARTMENT', sortOrder: 2 },
      { name: '營三部', type: 'DEPARTMENT', sortOrder: 3 },
      { name: '行銷企劃', type: 'DEPARTMENT', sortOrder: 4 },
      { name: '專案', type: 'PROJECT', sortOrder: 5 },
      { name: '系統', type: 'SYSTEM', sortOrder: 99, description: '系統設定與共用資源' },
    ]

    const workspaces: Record<string, any> = {}
    for (const wData of wsData) {
      let workspace = await prisma.workspace.findFirst({ where: { name: wData.name } })
      if (!workspace) {
        workspace = await prisma.workspace.create({ data: { ...wData, status: 'ACTIVE' } as any })
      }
      workspaces[wData.name] = workspace
    }

    const workspaceId = workspaces['營一部'].id

    // 3. Tasks (Kanban)
    const kanbanTasks = [
      { title: '準備 Q3 亞洲市場分析報告', status: 'TODO', priority: 'HIGH' },
      { title: '聯繫 Tokyo Packaging Solutions', status: 'TODO', priority: 'MEDIUM' },
      { title: '審核韓國化妝品名單', status: 'TODO', priority: 'LOW' },
      { title: '確認下週會議議程', status: 'TODO', priority: 'MEDIUM' },
      { title: '分析東南亞半導體市場', status: 'IN_PROGRESS', priority: 'URGENT' },
      { title: '與 Jakarta FMCG 進行初步洽談', status: 'IN_PROGRESS', priority: 'HIGH' },
      { title: '更新產品介紹簡報', status: 'IN_PROGRESS', priority: 'MEDIUM' },
      { title: '追蹤歐洲有機食品進口商進度', status: 'IN_PROGRESS', priority: 'MEDIUM' },
      { title: '建立日本市場初期名單', status: 'DONE', priority: 'HIGH' },
      { title: '完成 Q2 銷售總結', status: 'DONE', priority: 'MEDIUM' },
      { title: '發送產品型錄給 Osaka Auto Parts', status: 'DONE', priority: 'LOW' },
      { title: '系統帳號權限盤點', status: 'DONE', priority: 'MEDIUM' },
      { title: '取消印度市場實地考察', status: 'CANCELLED', priority: 'LOW' },
      { title: '暫緩菲律賓 BPO 合作案', status: 'CANCELLED', priority: 'LOW' },
    ]

    let tasksCreated = 0
    for (const kt of kanbanTasks) {
      const existing = await prisma.task.findFirst({ where: { title: kt.title, workspaceId } })
      if (!existing) {
        await prisma.task.create({
          data: { ...kt, workspaceId, assigneeId: users['wang@company.com'].id } as any
        })
        tasksCreated++
      }
    }

    // 4. Meetings
    const meetingsData = [
      { title: '日本開發會議', status: 'DONE', date: new Date('2026-07-25T10:00:00Z'), summary: '討論日本機械設備市場進入策略。', actionItems: [{ task: '整理前十大潛在客戶名單', owner: '王小明' }] },
      { title: 'Q3 季度合同審核', status: 'DONE', date: new Date('2026-07-28T14:00:00Z'), summary: '確認 Q3 開發資源分配。', actionItems: [{ task: '建 JIRA', owner: '系統管理員' }] },
      { title: '東南亞半導體判斷與分析', status: 'SCHEDULED', date: new Date('2026-07-30T09:00:00Z') },
      { title: '韓國化妝品代工廠溝通', status: 'SCHEDULED', date: new Date() },
    ]

    let meetingsCreated = 0
    for (const mData of meetingsData) {
      const existing = await prisma.meeting.findFirst({ where: { title: mData.title, workspaceId } })
      if (!existing) {
        await prisma.meeting.create({
          data: { ...mData, workspaceId, creatorId: users['admin@company.com'].id, actionItems: mData.actionItems || [] } as any
        })
        meetingsCreated++
      }
    }

    // 5. Knowledge
    const knowledgeData = [
      { title: '客戶開發流程 SOP', type: 'SOP', content: '1. 確認目標市場 2. 搜索潛在客戶 3. AI 分析 4. 人工審核 5. 聯繫。' },
      { title: '產品型錄 2026 Q3', type: 'DOCUMENT', content: '包含最新機械設備規格、技術參數以及價格區間。' },
      { title: '日本市場分析報告', type: 'REPORT', content: '日本包裝機械市場年成長率 8%，主要客群為食品業。' },
      { title: '常見客戶問題 (FAQ)', type: 'FAQ', content: 'Q: 支援多語言嗎？ A: 是，目前支援中英日。' },
      { title: '日本成功案例', type: 'CASE_STUDY', content: '成功協助 Tokyo Packaging 提升 30% 轉換率。' },
      { title: '會議記錄範本', type: 'TEMPLATE', content: '標準會議記錄格式，含出席者、議題、決議事項。' },
      { title: 'API 接口文檔', type: 'FAQ', content: 'Q: API 限制？ A: 每分鐘 1000 個請求。' },
    ]

    let knowledgeCreated = 0
    for (const kData of knowledgeData) {
      const existing = await prisma.knowledgeItem.findFirst({ where: { title: kData.title, workspaceId } })
      if (!existing) {
        await prisma.knowledgeItem.create({
          data: {
            ...kData,
            workspaceId,
            authorId: users['admin@company.com'].id,
            status: 'PUBLISHED',
            visibility: 'PUBLIC',
          } as any
        })
        knowledgeCreated++
      }
    }

    // 6. Decisions (Approvals)
    const entities = await prisma.businessEntity.findMany({ where: { workspaceId }, take: 5 })
    let decisionsCreated = 0
    for (const entity of entities) {
      const existing = await prisma.approval.findFirst({ where: { workspaceId, actionType: `review_${entity.id}` } })
      if (!existing) {
        await prisma.approval.create({
          data: {
            workspaceId,
            actionType: `review_${entity.id}`,
            payload: { entityName: entity.name, action: '審核客戶資料' },
            requesterId: users['wang@company.com'].id,
            approverId: users['admin@company.com'].id,
            status: ['PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 3)],
            reason: `審核 ${entity.name} 的客戶資料`,
          } as any
        })
        decisionsCreated++
      }
    }

    const result = {
      success: true,
      message: 'Seed completed!',
      counts: {
        users: Object.keys(users).length,
        workspaces: Object.keys(workspaces).length,
        tasksCreated,
        meetingsCreated,
        knowledgeCreated,
        decisionsCreated,
      }
    }

    console.log('Seed via API completed:', result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Seed failed:', error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
