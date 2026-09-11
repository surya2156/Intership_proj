import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { requireRole, requireSession } from '@/lib/auth';
import { memberInviteSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/api';

// C2 — Admins manage members and roles.
export async function GET() {
  try {
    const session = await requireSession();
    const members = await prisma.user.findMany({
      where: { workspaceId: session.user.workspaceId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ members });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const body = memberInviteSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const member = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
        role: body.role,
        workspaceId: session.user.workspaceId,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
