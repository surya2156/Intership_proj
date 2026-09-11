import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, AuthError } from '@/lib/auth';
import { feedbackUpdateSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/api';
import { classifyAndStore } from '@/app/api/feedback/route';

async function assertOwnedByWorkspace(id: string, workspaceId: string) {
  const feedback = await prisma.feedback.findUnique({ where: { id } });
  // SECURITY RULE: 404 (not 403) so we never confirm a foreign-tenant ID exists.
  if (!feedback || feedback.workspaceId !== workspaceId) {
    throw new AuthError('Not found', 404);
  }
  return feedback;
}

// C4 — inline status workflow: NEW -> REVIEWED -> ACTIONED.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN', 'ANALYST');
    await assertOwnedByWorkspace(params.id, session.user.workspaceId);

    const body = feedbackUpdateSchema.parse(await req.json());
    const updated = await prisma.feedback.update({ where: { id: params.id }, data: body });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

// AI1 — manual "re-classify" action for corrections.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN', 'ANALYST');
    const feedback = await assertOwnedByWorkspace(params.id, session.user.workspaceId);

    await classifyAndStore(feedback.id, session.user.workspaceId, feedback.content);

    const updated = await prisma.feedback.findUnique({
      where: { id: feedback.id },
      include: { themes: { include: { theme: true } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole('ADMIN');
    await assertOwnedByWorkspace(params.id, session.user.workspaceId);
    await prisma.feedback.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
