import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, requireSession } from '@/lib/auth';
import { reportGenerateSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/api';
import { generateVoCNarrative } from '@/lib/ai';

export async function GET() {
  try {
    const session = await requireSession();
    const reports = await prisma.report.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: 'desc' },
      include: { generatedBy: { select: { name: true } } },
    });
    return NextResponse.json({ reports });
  } catch (err) {
    return handleApiError(err);
  }
}

// AI4 — Voice-of-Customer report. Stats are pre-computed in code (ground
// truth); Claude only writes the narrative around them (brief §9.3).
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN', 'ANALYST');
    const { periodDays, title } = reportGenerateSchema.parse(await req.json());

    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - periodDays * 86400000);
    const workspaceId = session.user.workspaceId;

    const periodFeedback = await prisma.feedback.findMany({
      where: { workspaceId, createdAt: { gte: periodStart, lte: periodEnd } },
      include: { themes: { include: { theme: true } } },
    });

    const totalItems = periodFeedback.length;

    const sentimentBreakdown = {
      POS: periodFeedback.filter((f) => f.sentiment === 'POS').length,
      NEU: periodFeedback.filter((f) => f.sentiment === 'NEU').length,
      NEG: periodFeedback.filter((f) => f.sentiment === 'NEG').length,
    };

    // Theme counts for this period vs the prior period of equal length.
    const prevStart = new Date(periodStart.getTime() - periodDays * 86400000);
    const prevFeedback = await prisma.feedback.findMany({
      where: { workspaceId, createdAt: { gte: prevStart, lt: periodStart } },
      include: { themes: { include: { theme: true } } },
    });

    const countByTheme = (items: typeof periodFeedback) => {
      const map = new Map<string, number>();
      for (const item of items) {
        for (const ft of item.themes) {
          map.set(ft.theme.name, (map.get(ft.theme.name) ?? 0) + 1);
        }
      }
      return map;
    };

    const currentThemeCounts = countByTheme(periodFeedback);
    const prevThemeCounts = countByTheme(prevFeedback);

    const topThemes = [...currentThemeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => {
        const prevCount = prevThemeCounts.get(name) ?? 0;
        const deltaPct = prevCount === 0 ? 100 : Math.round(((count - prevCount) / prevCount) * 100);
        return { name, count, deltaPct };
      });

    const sampleQuotes = periodFeedback
      .filter((f) => f.sentiment === 'NEG' || f.sentiment === 'POS')
      .slice(0, 6)
      .map((f) => f.content);

    const periodLabel = `${periodStart.toDateString()} – ${periodEnd.toDateString()}`;

    const narrative = await generateVoCNarrative({
      periodLabel,
      totalItems,
      sentimentBreakdown,
      topThemes,
      sampleQuotes,
    });

    const report = await prisma.report.create({
      data: {
        title: title || `Voice of Customer — ${periodDays}-day digest`,
        periodStart,
        periodEnd,
        workspaceId,
        generatedById: session.user.id,
        contentJson: {
          periodLabel,
          totalItems,
          sentimentBreakdown,
          topThemes,
          sampleQuotes,
          narrative,
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
