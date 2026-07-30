import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seed...')

  // 1. Users
  const usersData = [
    { email: 'admin@company.com', name: '系統管理員', status: 'ACTIVE', paletteId: 'amethyst' },
    { email: 'wang@company.com', name: '王小明', status: 'ACTIVE', paletteId: 'blue' },
    { email: 'lee@company.com', name: '李美玲', status: 'ACTIVE', paletteId: 'green' },
    { email: 'chen@company.com', name: '陳志豪', status: 'ACTIVE', paletteId: 'orange' },
    { email: 'lin@company.com', name: '林雅婷', status: 'ACTIVE', paletteId: 'pink' },
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
    { name: '營一部', type: 'DEPARTMENT', sortOrder: 1 },
    { name: '營二部', type: 'DEPARTMENT', sortOrder: 2 },
    { name: '營三部', type: 'DEPARTMENT', sortOrder: 3 },
    { name: '行銷企劃', type: 'DEPARTMENT', sortOrder: 4 },
    { name: '專案', type: 'PROJECT', sortOrder: 5 },
    { name: '系統', type: 'SYSTEM', sortOrder: 99, description: '系統設定與共用資源' },
  ]

  const workspaces: Record<string, any> = {}
  for (const wData of workspacesData) {
    let workspace = await prisma.workspace.findFirst({ where: { name: wData.name } })
    if (!workspace) {
      workspace = await prisma.workspace.create({ data: { ...wData, status: 'ACTIVE' } })
    } else {
      workspace = await prisma.workspace.update({ where: { id: workspace.id }, data: { ...wData, status: 'ACTIVE' } })
    }
    workspaces[wData.name] = workspace

    // 3. WorkspaceMembers
    // Add admin to all
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: users['admin@company.com'].id } },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: { workspaceId: workspace.id, userId: users['admin@company.com'].id, role: 'ADMIN', status: 'ACTIVE' }
    })
  }
  
  // Assign others to workspaces
  const assignments = [
    { email: 'wang@company.com', ws: '營一部', role: 'MANAGER' },
    { email: 'lee@company.com', ws: '營二部', role: 'MANAGER' },
    { email: 'chen@company.com', ws: '營三部', role: 'MANAGER' },
    { email: 'lin@company.com', ws: '行銷企劃', role: 'MANAGER' },
    { email: 'wang@company.com', ws: '專案', role: 'MEMBER' },
  ]

  for (const a of assignments) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspaces[a.ws].id, userId: users[a.email].id } },
      update: { role: a.role, status: 'ACTIVE' },
      create: { workspaceId: workspaces[a.ws].id, userId: users[a.email].id, role: a.role, status: 'ACTIVE' }
    })
  }
  console.log('Workspaces & Members ready.')

  const workspaceId = workspaces['營一部'].id

  console.log('Seed completed successfully (Core data only)!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
