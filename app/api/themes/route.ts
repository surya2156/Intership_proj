import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

// AI2 — theme list with counts; supports the trends view (current vs previous period).
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const periodDays = Number(searchParams.get('periodDays') ?? 30);

    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 86400000);
    const prevPeriodStart = new Date(periodStart.getTime() - periodDays * 86400000);

    const themes = await prisma.theme.findMany({
      where: { workspaceId: session.user.workspaceId },
      include: {
        feedback: {
          include: { feedback: { select: { createdAt: true } } },
        },
      },
    });

    const data = themes.map((theme) => {
      const currentCount = theme.feedback.filter(
        (ft) => ft.feedback.createdAt >= periodStart
      ).length;
      const previousCount = theme.feedback.filter(
        (ft) => ft.feedback.createdAt >= prevPeriodStart && ft.feedback.createdAt < periodStart
      ).length;

      const deltaPct =
        previousCount === 0
          ? currentCount > 0
            ? 100
            : 0
          : Math.round(((currentCount - previousCount) / previousCount) * 100);

      return {
        id: theme.id,
        name: theme.name,
        color: theme.color,
        totalCount: theme.feedback.length,
        currentPeriodCount: currentCount,
        previousPeriodCount: previousCount,
        deltaPct,
        isSpiking: deltaPct >= 50 && currentCount >= 3,
      };
    });

    data.sort((a, b) => b.currentPeriodCount - a.currentPeriodCount);

    return NextResponse.json({ themes: data, periodDays });
  } catch (err) {
    return handleApiError(err);
  }
}
