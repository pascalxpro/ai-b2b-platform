export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

export async function GET() {
  try {
    const existing = await prisma.user.findUnique({ where: { email: 'admin@b2b.com' } });
    if (existing) {
      // Update password if no hash set
      if (!existing.passwordHash) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash: crypto.createHash('sha256').update('admin123').digest('hex') },
        });
      }
      return NextResponse.json({ message: 'Admin user already exists', email: 'admin@b2b.com' });
    }

    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@b2b.com',
        passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ message: 'Admin user created', email: 'admin@b2b.com', defaultPassword: 'admin123' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
