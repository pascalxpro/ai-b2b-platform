import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // 1. Create or update admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {
      name: '系統管理員',
      status: 'ACTIVE',
      paletteId: 'amethyst',
    },
    create: {
      name: '系統管理員',
      email: 'admin@company.com',
      status: 'ACTIVE',
      paletteId: 'amethyst',
    },
  })
  console.log('Admin user ready:', admin.email)

  // 2. Workspaces data
  const workspacesData = [
    { name: '營一部', type: 'DEPARTMENT', sortOrder: 1 },
    { name: '營二部', type: 'DEPARTMENT', sortOrder: 2 },
    { name: '營三部', type: 'DEPARTMENT', sortOrder: 3 },
    { name: '行銷企劃', type: 'DEPARTMENT', sortOrder: 4 },
    { name: '專案', type: 'PROJECT', sortOrder: 5 },
    { name: '系統', type: 'SYSTEM', sortOrder: 99, description: '系統設定與共用資源' },
  ] as const

  const createdWorkspaces = []

  for (const wData of workspacesData) {
    // Check if workspace already exists by name
    let workspace = await prisma.workspace.findFirst({
      where: { name: wData.name }
    })

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: wData.name,
          type: wData.type,
          sortOrder: wData.sortOrder,
          description: wData.description,
          status: 'ACTIVE'
        }
      })
    } else {
      workspace = await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          type: wData.type,
          sortOrder: wData.sortOrder,
          description: wData.description,
          status: 'ACTIVE'
        }
      })
    }
    
    createdWorkspaces.push(workspace)

    // Add admin as ADMIN member to all workspaces
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: admin.id
        }
      },
      update: {
        role: 'ADMIN',
        status: 'ACTIVE'
      },
      create: {
        workspaceId: workspace.id,
        userId: admin.id,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    })
  }
  
  console.log('Workspaces and admin memberships ready')

  // 3. Demo user
  const demo = await prisma.user.upsert({
    where: { email: 'demo@company.com' },
    update: {
      name: '示範業務',
      status: 'ACTIVE'
    },
    create: {
      name: '示範業務',
      email: 'demo@company.com',
      status: 'ACTIVE'
    }
  })

  // Add demo user to '營一部'
  const dept1 = createdWorkspaces.find(w => w.name === '營一部')
  if (dept1) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: dept1.id,
          userId: demo.id
        }
      },
      update: {
        role: 'MEMBER',
        status: 'ACTIVE'
      },
      create: {
        workspaceId: dept1.id,
        userId: demo.id,
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    })
  }
  
  console.log('Demo user ready:', demo.email)
  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
