import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession, AuthError } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: { generatedBy: { select: { name: true } } },
    });

    if (!report || report.workspaceId !== session.user.workspaceId) {
      throw new AuthError('Not found', 404);
    }

    return NextResponse.json(report);
  } catch (err) {
    return handleApiError(err);
  }
}
