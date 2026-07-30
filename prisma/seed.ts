import { PrismaClient, UserStatus, WorkspaceType, WorkspaceStatus, WorkspaceRole, MemberStatus, BusinessEntityStatus, SearchTaskStatus, QualityStatus, ConversionStatus, TaskPriority, TaskStatus, MeetingStatus, KnowledgeItemType, KnowledgeVisibility, KnowledgeStatus, ConversationStatus, MessageRole, ApprovalStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // 1. Users
  const usersData = [
    { email: 'admin@company.com', name: '系統管理員', status: UserStatus.ACTIVE, paletteId: 'amethyst' },
    { email: 'wang@company.com', name: '王小明', status: UserStatus.ACTIVE, paletteId: 'blue' },
    { email: 'lee@company.com', name: '李美玲', status: UserStatus.ACTIVE, paletteId: 'green' },
    { email: 'chen@company.com', name: '陳志豪', status: UserStatus.ACTIVE, paletteId: 'orange' },
    { email: 'lin@company.com', name: '林雅婷', status: UserStatus.ACTIVE, paletteId: 'pink' },
  ]

  const users: Record<string, any> = {}
  for (const u of usersData) {
    users[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, status: u.status, paletteId: u.paletteId },
      create: u,
    })
  }
  console.log('Users ready.')

  // 2. Workspaces
  const workspacesData = [
    { name: '營一部', type: WorkspaceType.DEPARTMENT, sortOrder: 1 },
    { name: '營二部', type: WorkspaceType.DEPARTMENT, sortOrder: 2 },
    { name: '營三部', type: WorkspaceType.DEPARTMENT, sortOrder: 3 },
    { name: '行銷企劃', type: WorkspaceType.DEPARTMENT, sortOrder: 4 },
    { name: '專案', type: WorkspaceType.PROJECT, sortOrder: 5 },
    { name: '系統', type: WorkspaceType.SYSTEM, sortOrder: 99, description: '系統設定與共用資源' },
  ]

  const workspaces: Record<string, any> = {}
  for (const wData of workspacesData) {
    let workspace = await prisma.workspace.findFirst({ where: { name: wData.name } })
    if (!workspace) {
      workspace = await prisma.workspace.create({ data: { ...wData, status: WorkspaceStatus.ACTIVE } })
    } else {
      workspace = await prisma.workspace.update({ where: { id: workspace.id }, data: { ...wData, status: WorkspaceStatus.ACTIVE } })
    }
    workspaces[wData.name] = workspace

    // 3. WorkspaceMembers
    // Add admin to all
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: users['admin@company.com'].id } },
      update: { role: WorkspaceRole.ADMIN, status: MemberStatus.ACTIVE },
      create: { workspaceId: workspace.id, userId: users['admin@company.com'].id, role: WorkspaceRole.ADMIN, status: MemberStatus.ACTIVE }
    })
  }
  
  // Assign others to workspaces
  const assignments = [
    { email: 'wang@company.com', ws: '營一部', role: WorkspaceRole.MANAGER },
    { email: 'lee@company.com', ws: '營二部', role: WorkspaceRole.MANAGER },
    { email: 'chen@company.com', ws: '營三部', role: WorkspaceRole.MANAGER },
    { email: 'lin@company.com', ws: '行銷企劃', role: WorkspaceRole.MANAGER },
    { email: 'wang@company.com', ws: '專案', role: WorkspaceRole.MEMBER },
  ]

  for (const a of assignments) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspaces[a.ws].id, userId: users[a.email].id } },
      update: { role: a.role, status: MemberStatus.ACTIVE },
      create: { workspaceId: workspaces[a.ws].id, userId: users[a.email].id, role: a.role, status: MemberStatus.ACTIVE }
    })
  }
  console.log('Workspaces & Members ready.')

  const workspaceId = workspaces['營一部'].id

  // 4. BusinessEntities
  const entitiesData = [
    { name: 'Tokyo Packaging Solutions', country: 'Japan', city: 'Tokyo', industry: 'Machinery', companyType: 'Manufacturer', website: 'https://tokyopackaging.co.jp', email: 'contact@tokyopackaging.co.jp', status: BusinessEntityStatus.AI_REVIEWED },
    { name: 'Osaka Auto Parts', country: 'Japan', city: 'Osaka', industry: 'Automotive', companyType: 'Manufacturer', website: 'https://osaka-auto.jp', email: 'info@osaka-auto.jp', status: BusinessEntityStatus.VALID },
    { name: 'Kyoto Robotics', country: 'Japan', city: 'Kyoto', industry: 'Robotics', companyType: 'R&D', website: 'https://kyotorobotics.jp', email: 'hello@kyotorobotics.jp', status: BusinessEntityStatus.NEW },
    { name: 'Seoul Cosmetics', country: 'South Korea', city: 'Seoul', industry: 'Cosmetics', companyType: 'OEM', website: 'https://seoulcosmetics.kr', email: 'biz@seoulcosmetics.kr', status: BusinessEntityStatus.PENDING_REVIEW },
    { name: 'Busan Tech', country: 'South Korea', city: 'Busan', industry: 'Electronics', companyType: 'Manufacturer', website: 'https://busantech.kr', email: 'sales@busantech.kr', status: BusinessEntityStatus.VALID },
    { name: 'Incheon Logistics', country: 'South Korea', city: 'Incheon', industry: 'Logistics', companyType: 'Service Provider', website: 'https://incheonlogistics.kr', email: 'support@incheonlogistics.kr', status: BusinessEntityStatus.NEW },
    { name: 'Singapore Semiconductor Distributors', country: 'Singapore', city: 'Singapore', industry: 'Semiconductor', companyType: 'Distributor', website: 'https://singaporesemi.sg', email: 'contact@singaporesemi.sg', status: BusinessEntityStatus.VALID },
    { name: 'KL Tech Hub', country: 'Malaysia', city: 'Kuala Lumpur', industry: 'IT', companyType: 'Service', website: 'https://kltechhub.my', email: 'info@kltechhub.my', status: BusinessEntityStatus.AI_REVIEWED },
    { name: 'Jakarta FMCG', country: 'Indonesia', city: 'Jakarta', industry: 'FMCG', companyType: 'Distributor', website: 'https://jakartafmcg.id', email: 'sales@jakartafmcg.id', status: BusinessEntityStatus.VALID },
    { name: 'Bangkok Textiles', country: 'Thailand', city: 'Bangkok', industry: 'Textiles', companyType: 'Manufacturer', website: 'https://bangkoktextiles.th', email: 'contact@bangkoktextiles.th', status: BusinessEntityStatus.NEW },
    { name: 'Manila BPO', country: 'Philippines', city: 'Manila', industry: 'BPO', companyType: 'Outsourcing', website: 'https://manilabpo.ph', email: 'hello@manilabpo.ph', status: BusinessEntityStatus.PENDING_REVIEW },
    { name: 'Hanoi Softworks', country: 'Vietnam', city: 'Hanoi', industry: 'Software', companyType: 'Development', website: 'https://hanoisoftworks.vn', email: 'dev@hanoisoftworks.vn', status: BusinessEntityStatus.VALID },
    { name: 'Mumbai IT Outsourcing', country: 'India', city: 'Mumbai', industry: 'IT Services', companyType: 'Outsourcing', website: 'https://mumbai-it.in', email: 'business@mumbai-it.in', status: BusinessEntityStatus.VALID },
    { name: 'Berlin Organic Foods', country: 'Germany', city: 'Berlin', industry: 'Food & Beverage', companyType: 'Importer', website: 'https://berlinorganic.de', email: 'import@berlinorganic.de', status: BusinessEntityStatus.AI_REVIEWED },
    { name: 'Paris Gourmet Imports', country: 'France', city: 'Paris', industry: 'Food & Beverage', companyType: 'Importer', website: 'https://parisgourmet.fr', email: 'contact@parisgourmet.fr', status: BusinessEntityStatus.VALID },
  ]

  // Clear existing entities to prevent duplicates if running multiple times (or just rely on finding by name)
  const entities: Record<string, any> = {}
  for (const eData of entitiesData) {
    let entity = await prisma.businessEntity.findFirst({ where: { name: eData.name, workspaceId } })
    if (!entity) {
      entity = await prisma.businessEntity.create({
        data: { ...eData, workspaceId, ownerUserId: users['wang@company.com'].id }
      })
    } else {
      entity = await prisma.businessEntity.update({
        where: { id: entity.id },
        data: { ...eData }
      })
    }
    entities[eData.name] = entity

    // 5. LeadScores
    const scores = {
      fit: Math.floor(Math.random() * 40) + 60,
      intent: Math.floor(Math.random() * 50) + 50,
      contactability: Math.floor(Math.random() * 60) + 40,
      value: Math.floor(Math.random() * 30) + 70,
      risk: Math.floor(Math.random() * 30),
      confidence: Math.floor(Math.random() * 20) + 80,
    }

    const existingScore = await prisma.leadScore.findUnique({ where: { entityId: entity.id } })
    if (!existingScore) {
      await prisma.leadScore.create({
        data: {
          entityId: entity.id,
          ...scores,
          scoreReason: { note: "自動評分計算" }
        }
      })
    } else {
      await prisma.leadScore.update({
        where: { entityId: entity.id },
        data: scores
      })
    }
  }
  console.log('BusinessEntities & LeadScores ready.')

  // 6. SearchTasks
  const tasksData = [
    { name: '日本食品包裝機械製造商', status: SearchTaskStatus.COMPLETED, targetCount: 50, priority: 1 },
    { name: '東南亞半導體設備經銷商', status: SearchTaskStatus.RUNNING, targetCount: 100, priority: 2 },
    { name: '歐洲有機食品進口商', status: SearchTaskStatus.COMPLETED, targetCount: 30, priority: 1 },
    { name: '韓國化妝品 OEM 代工廠', status: SearchTaskStatus.DRAFT, targetCount: 200, priority: 0 },
    { name: '印度 IT 服務外包商', status: SearchTaskStatus.QUEUED, targetCount: 50, priority: 1 },
  ]

  const searchTasks: Record<string, any> = {}
  for (const stData of tasksData) {
    let st = await prisma.searchTask.findFirst({ where: { name: stData.name, workspaceId } })
    if (!st) {
      st = await prisma.searchTask.create({
        data: {
          ...stData,
          workspaceId,
          createdById: users['wang@company.com'].id,
          queryText: stData.name
        }
      })
    }
    searchTasks[stData.name] = st
  }
  console.log('SearchTasks ready.')

  // 7. SearchResults (Attach to the first COMPLETED task: 日本食品包裝機械製造商)
  const jpTask = searchTasks['日本食品包裝機械製造商']
  if (jpTask) {
    for (let i = 1; i <= 20; i++) {
      const companyName = `Japan Pack Corp ${i}`
      let sr = await prisma.searchResult.findFirst({ where: { companyName, searchTaskId: jpTask.id } })
      if (!sr) {
        await prisma.searchResult.create({
          data: {
            searchTaskId: jpTask.id,
            workspaceId,
            companyName,
            country: 'Japan',
            website: `https://japanpack${i}.co.jp`,
            sourceCount: Math.floor(Math.random() * 5) + 1,
            qualityStatus: QualityStatus.NEW,
            conversionStatus: ConversionStatus.NONE,
            scoreJson: { score: Math.floor(Math.random() * 40) + 60 }
          }
        })
      }
    }
  }
  console.log('SearchResults ready.')

  // 8. Tasks (Kanban)
  const kanbanTasks = [
    // TODO
    { title: '準備 Q3 亞洲市場分析報告', status: TaskStatus.TODO, priority: TaskPriority.HIGH },
    { title: '聯繫 Tokyo Packaging Solutions', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
    { title: '審核韓國化妝品名單', status: TaskStatus.TODO, priority: TaskPriority.LOW },
    { title: '確認下週會議議程', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM },
    // IN_PROGRESS
    { title: '分析東南亞半導體市場', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.URGENT },
    { title: '與 Jakarta FMCG 進行初步洽談', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH },
    { title: '更新產品介紹簡報', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM },
    { title: '追蹤歐洲有機食品進口商進度', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM },
    // DONE
    { title: '建立日本市場初期名單', status: TaskStatus.DONE, priority: TaskPriority.HIGH },
    { title: '完成 Q2 銷售總結', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM },
    { title: '發送產品型錄給 Osaka Auto Parts', status: TaskStatus.DONE, priority: TaskPriority.LOW },
    { title: '系統帳號權限盤點', status: TaskStatus.DONE, priority: TaskPriority.MEDIUM },
    // CANCELLED
    { title: '取消印度市場實地考察', status: TaskStatus.CANCELLED, priority: TaskPriority.LOW },
    { title: '暫緩菲律賓 BPO 合作案', status: TaskStatus.CANCELLED, priority: TaskPriority.LOW },
  ]

  for (const kt of kanbanTasks) {
    let t = await prisma.task.findFirst({ where: { title: kt.title, workspaceId } })
    if (!t) {
      await prisma.task.create({
        data: {
          ...kt,
          workspaceId,
          assigneeId: users['wang@company.com'].id
        }
      })
    }
  }
  console.log('Kanban Tasks ready.')

  // 9. Meetings
  const meetingsData = [
    { title: '日本市場開發策略會議', status: MeetingStatus.COMPLETED, date: new Date('2026-07-25T10:00:00Z'), summary: '討論日本包裝機械市場的切入點。', actionItems: [{ task: '整理前十名潛在客戶名單', owner: '王小明' }] },
    { title: 'Q3 產品路徑圖同步', status: MeetingStatus.COMPLETED, date: new Date('2026-07-28T14:00:00Z'), summary: '確認 Q3 開發資源分配。', actionItems: [{ task: '更新 JIRA', owner: '系統管理員' }] },
    { title: '東南亞半導體經銷商評估', status: MeetingStatus.PROCESSING, date: new Date('2026-07-30T09:00:00Z') },
    { title: '韓國化妝品代工廠初步接洽', status: MeetingStatus.RECORDING, date: new Date() },
    { title: '歐洲進口商合作提案審閱', status: MeetingStatus.SCHEDULED, date: new Date('2026-08-05T15:00:00Z') },
  ]

  for (const md of meetingsData) {
    let m = await prisma.meeting.findFirst({ where: { title: md.title, workspaceId } })
    if (!m) {
      await prisma.meeting.create({
        data: {
          ...md,
          workspaceId,
          createdById: users['wang@company.com'].id
        }
      })
    }
  }
  console.log('Meetings ready.')

  // 10. KnowledgeItems
  const knowledgeData = [
    { title: '公司簡介 2026', type: KnowledgeItemType.DOCUMENT, content: '這是我們公司的詳細簡介，包含願景與使命。' },
    { title: 'B2B 智能平台產品手冊', type: KnowledgeItemType.PRODUCT, content: '平台功能詳解、API 串接指南。' },
    { title: '常見客戶問答集 (FAQ)', type: KnowledgeItemType.FAQ, content: 'Q: 平台支援多國語言嗎？ A: 是的，目前支援中英文。' },
    { title: '日本市場成功案例', type: KnowledgeItemType.CASE_STUDY, content: '如何協助 Tokyo Packaging 提升 30% 轉換率。' },
    { title: '標準合作提案模板', type: KnowledgeItemType.TEMPLATE, content: '這是一份可用於向潛在客戶提案的標準模板。' },
    { title: '競爭者分析報告 - 2026 Q2', type: KnowledgeItemType.DOCUMENT, content: '市場上主要競爭對手的優劣勢分析。' },
    { title: '資料安全白皮書', type: KnowledgeItemType.DOCUMENT, content: '我們如何保護客戶的商業機密與隱私。' },
    { title: '東南亞市場進入策略', type: KnowledgeItemType.DOCUMENT, content: '針對東南亞各國的文化差異與商業習慣分析。' },
    { title: 'API 整合常見問題', type: KnowledgeItemType.FAQ, content: 'Q: API 限制為何？ A: 每分鐘 1000 次請求。' },
    { title: '客戶拜訪紀錄表模板', type: KnowledgeItemType.TEMPLATE, content: '業務外出拜訪時需填寫的標準表單。' },
    { title: '韓國化妝品市場概況', type: KnowledgeItemType.DOCUMENT, content: '2026 年韓國化妝品代工市場規模與趨勢。' },
    { title: '內部員工 onboarding 指南', type: KnowledgeItemType.DOCUMENT, content: '新進員工首週必讀事項。' },
  ]

  for (const kd of knowledgeData) {
    let k = await prisma.knowledgeItem.findFirst({ where: { title: kd.title, workspaceId } })
    if (!k) {
      await prisma.knowledgeItem.create({
        data: {
          ...kd,
          workspaceId,
          visibility: KnowledgeVisibility.WORKSPACE,
          status: KnowledgeStatus.ACTIVE,
          createdById: users['wang@company.com'].id
        }
      })
    }
  }
  console.log('KnowledgeItems ready.')

  // 11. Conversations + Messages
  const conversationsData = [
    {
      channel: 'web',
      messages: [
        { role: MessageRole.USER, content: '請幫我列出日本前五大的包裝機械製造商。' },
        { role: MessageRole.ASSISTANT, content: '好的，正在為您搜尋日本包裝機械製造商的資料。' },
        { role: MessageRole.TOOL, content: '{"action": "search", "query": "Japan packaging machinery manufacturers top 5"}' },
        { role: MessageRole.ASSISTANT, content: '根據最新資料，日本前五大包裝機械製造商包括：1. Tokyo Packaging Solutions 2. Osaka Pack... 您需要我將這些名單加入追蹤嗎？' },
        { role: MessageRole.USER, content: '是的，請幫我加入名單，並標記為高潛力。' },
        { role: MessageRole.ASSISTANT, content: '已將 5 家公司加入您的工作區名單，並標記相關分數。' },
      ]
    },
    {
      channel: 'web',
      messages: [
        { role: MessageRole.USER, content: '幫我總結一下昨天關於韓國市場的會議紀錄。' },
        { role: MessageRole.ASSISTANT, content: '沒問題，我正在讀取昨天的會議紀錄。' },
        { role: MessageRole.TOOL, content: '{"action": "get_meeting_summary", "date": "yesterday", "keyword": "韓國"}' },
        { role: MessageRole.ASSISTANT, content: '昨天的會議主要結論為：1. 優先鎖定首爾與釜山的代工廠。 2. 行銷材料需於下週前完成韓文翻譯。' },
        { role: MessageRole.USER, content: '太好了，幫我把第二點建立成一個待辦事項。' },
        { role: MessageRole.ASSISTANT, content: '已為您建立待辦事項：「完成行銷材料韓文翻譯」，優先級為高。' },
      ]
    }
  ]

  for (let i = 0; i < conversationsData.length; i++) {
    const cData = conversationsData[i]
    // Simple check if conversation exists (create fresh ones for simplicity if we don't have a good unique key, or just create them)
    // To be idempotent, we'll check if a conversation with this exact number of messages and first message content exists
    const firstMsgContent = cData.messages[0].content
    const existingMsg = await prisma.message.findFirst({ where: { content: firstMsgContent } })
    
    if (!existingMsg) {
      const conv = await prisma.conversation.create({
        data: {
          workspaceId,
          userId: users['wang@company.com'].id,
          channel: cData.channel,
          status: ConversationStatus.ACTIVE,
        }
      })

      for (const m of cData.messages) {
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            role: m.role,
            content: m.content
          }
        })
      }
    }
  }
  console.log('Conversations ready.')

  // 12. Approvals
  const approvalsData = [
    { actionType: 'BUDGET_REQUEST', reason: '申請擴大日本市場調查預算', status: ApprovalStatus.PENDING },
    { actionType: 'DATA_EXPORT', reason: '匯出 Q2 潛在客戶名單給外部合作夥伴', status: ApprovalStatus.PENDING },
    { actionType: 'CAMPAIGN_LAUNCH', reason: '啟動東南亞電子報行銷活動', status: ApprovalStatus.PENDING },
    { actionType: 'CONTRACT_SIGN', reason: '與 Tokyo Packaging Solutions 簽署 NDA', status: ApprovalStatus.APPROVED },
    { actionType: 'PURCHASE', reason: '購買新的產業分析報告', status: ApprovalStatus.REJECTED },
  ]

  for (const appData of approvalsData) {
    let app = await prisma.approval.findFirst({ where: { reason: appData.reason, workspaceId } })
    if (!app) {
      await prisma.approval.create({
        data: {
          ...appData,
          workspaceId,
          payload: { detail: appData.reason },
          requesterId: users['wang@company.com'].id,
          approverId: (appData.status !== ApprovalStatus.PENDING) ? users['admin@company.com'].id : null
        }
      })
    }
  }
  console.log('Approvals ready.')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
