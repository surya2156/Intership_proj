import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signupSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/api';

// C1 — Sign-up creates a User AND a Workspace; the creator becomes ADMIN.
export async function POST(req: NextRequest) {
  try {
    const body = signupSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const workspace = await prisma.workspace.create({
      data: {
        name: body.workspaceName,
        users: {
          create: {
            name: body.name,
            email: body.email.toLowerCase(),
            passwordHash,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json({ workspaceId: workspace.id, userId: workspace.users[0].id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
