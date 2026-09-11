import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

// C5 — analytics dashboard: stat cards + 3 charts, all reflecting real data.
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get('days') ?? 30);
    const workspaceId = session.user.workspaceId;

    const since = new Date(Date.now() - days * 86400000);
    const weekAgo = new Date(Date.now() - 7 * 86400000);

    const [total, negative, newThisWeek, periodItems] = await Promise.all([
      prisma.feedback.count({ where: { workspaceId } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: 'NEG' } }),
      prisma.feedback.count({ where: { workspaceId, createdAt: { gte: weekAgo } } }),
      prisma.feedback.findMany({
        where: { workspaceId, createdAt: { gte: since } },
        select: { createdAt: true, sentiment: true, channel: true },
      }),
    ]);

    // Volume over time (bucketed by day).
    const volumeByDay = new Map<string, number>();
    for (const item of periodItems) {
      const key = item.createdAt.toISOString().slice(0, 10);
      volumeByDay.set(key, (volumeByDay.get(key) ?? 0) + 1);
    }
    const volumeSeries = [...volumeByDay.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, count]) => ({ date, count }));

    // Sentiment breakdown.
    const sentimentBreakdown = {
      POS: periodItems.filter((i) => i.sentiment === 'POS').length,
      NEU: periodItems.filter((i) => i.sentiment === 'NEU').length,
      NEG: periodItems.filter((i) => i.sentiment === 'NEG').length,
      unclassified: periodItems.filter((i) => !i.sentiment).length,
    };

    // Top themes.
    const themeCounts = await prisma.feedbackTheme.findMany({
      where: { feedback: { workspaceId, createdAt: { gte: since } } },
      include: { theme: { select: { name: true, color: true } } },
    });
    const themeMap = new Map<string, { name: string; color: string; count: number }>();
    for (const ft of themeCounts) {
      const key = ft.theme.name;
      const existing = themeMap.get(key);
      if (existing) existing.count++;
      else themeMap.set(key, { name: ft.theme.name, color: ft.theme.color, count: 1 });
    }
    const topThemes = [...themeMap.values()].sort((a, b) => b.count - a.count).slice(0, 8);

    return NextResponse.json({
      stats: {
        totalItems: total,
        negativePct: total > 0 ? Math.round((negative / total) * 100) : 0,
        newThisWeek,
      },
      volumeSeries,
      sentimentBreakdown,
      topThemes,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
