import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession, AuthError } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

// AI2 — "Clicking a theme drills into the underlying feedback items."
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();

    const theme = await prisma.theme.findUnique({ where: { id: params.id } });
    if (!theme || theme.workspaceId !== session.user.workspaceId) {
      throw new AuthError('Not found', 404);
    }

    const items = await prisma.feedbackTheme.findMany({
      where: { themeId: params.id },
      include: { feedback: true },
      orderBy: { feedback: { createdAt: 'desc' } },
      take: 100,
    });

    return NextResponse.json({
      theme,
      feedback: items.map((ft) => ft.feedback),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
