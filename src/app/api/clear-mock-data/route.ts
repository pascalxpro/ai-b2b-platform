import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Delete in correct order to respect foreign key constraints
    
    // 1. Delete dependent entities first
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.approval.deleteMany({});
    await prisma.knowledgeItem.deleteMany({});
    await prisma.meeting.deleteMany({});
    await prisma.task.deleteMany({});
    
    // 2. Delete Search related
    await prisma.searchResult.deleteMany({});
    await prisma.searchTask.deleteMany({});
    
    // 3. Delete Business Entities related
    await prisma.evidence.deleteMany({});
    await prisma.leadScore.deleteMany({});
    await prisma.businessEntity.deleteMany({});

    return NextResponse.json({ message: 'All mock data cleared successfully. Only Users and Workspaces remain.' });
  } catch (error: any) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
