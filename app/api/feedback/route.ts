import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession, requireRole } from '@/lib/auth';
import { feedbackCreateSchema, feedbackQuerySchema } from '@/lib/validators';
import { handleApiError } from '@/lib/api';
import { classifyFeedback } from '@/lib/ai';
import { embedText } from '@/lib/search';
import type { Prisma } from '@prisma/client';

// C4 — Feedback inbox: server-side pagination, filters, full-text search.
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const q = feedbackQuerySchema.parse(Object.fromEntries(searchParams));

    // SECURITY RULE: every query is scoped to the caller's workspaceId.
    const where: Prisma.FeedbackWhereInput = { workspaceId: session.user.workspaceId };

    if (q.channel) where.channel = q.channel;
    if (q.sentiment) where.sentiment = q.sentiment;
    if (q.status) where.status = q.status;
    if (q.themeId) where.themes = { some: { themeId: q.themeId } };
    if (q.search) where.content = { contains: q.search, mode: 'insensitive' };
    if (q.from || q.to) {
      where.createdAt = {
        ...(q.from ? { gte: new Date(q.from) } : {}),
        ...(q.to ? { lte: new Date(q.to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { themes: { include: { theme: true } } },
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      items,
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

// C3 — Single-entry ingestion. ADMIN and ANALYST may ingest; VIEWER may not.
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN', 'ANALYST');
    const body = feedbackCreateSchema.parse(await req.json());

    const feedback = await prisma.feedback.create({
      data: {
        ...body,
        workspaceId: session.user.workspaceId,
      },
    });

    // Fire-and-await classification synchronously for the demo path (small
    // volumes). For production scale this would be pushed to a queue.
    await classifyAndStore(feedback.id, session.user.workspaceId, feedback.content);

    const withThemes = await prisma.feedback.findUnique({
      where: { id: feedback.id },
      include: { themes: { include: { theme: true } } },
    });

    return NextResponse.json(withThemes, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * AI1 — classify a feedback item, persist the result, upsert themes, and
 * store its embedding for Ask LOOP (AI3). Shared by single-entry, CSV, and
 * channel ingestion, plus the manual "re-classify" action.
 */
export async function classifyAndStore(feedbackId: string, workspaceId: string, content: string) {
  const existingThemes = await prisma.theme.findMany({
    where: { workspaceId },
    select: { name: true },
  });

  const result = await classifyFeedback(content, existingThemes.map((t) => t.name));

  if (!result) {
    // Classification failed twice — flag for manual review, leave as NEW.
    await prisma.feedback.update({ where: { id: feedbackId }, data: { status: 'NEW' } });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.feedback.update({
      where: { id: feedbackId },
      data: {
        sentiment: result.sentiment,
        sentimentScore: result.sentimentScore,
        featureArea: result.featureArea,
      },
    });

    // AI2 — assign to existing themes where they fit, or create new ones.
    for (const themeName of result.themes) {
      const theme = await tx.theme.upsert({
        where: { workspaceId_name: { workspaceId, name: themeName } },
        update: {},
        create: { workspaceId, name: themeName },
      });

      await tx.feedbackTheme.upsert({
        where: { feedbackId_themeId: { feedbackId, themeId: theme.id } },
        update: { confidence: 1.0 },
        create: { feedbackId, themeId: theme.id, confidence: 1.0 },
      });
    }

    // AI3 — embed for semantic retrieval.
    const vector = embedText(content);
    await tx.embedding.upsert({
      where: { feedbackId },
      update: { vector },
      create: { feedbackId, vector },
    });
  });
}
