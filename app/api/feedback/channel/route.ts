import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api';
import { classifyAndStore } from '@/app/api/feedback/route';
import { SIMULATED_CHANNELS } from '@/lib/simulated-channels';

/**
 * Simulates pulling a fresh batch of feedback from an external channel
 * (App Store reviews, NPS survey, etc). Out of scope per the brief is a
 * *live* third-party integration — this endpoint stands in for one so the
 * ingestion pipeline (classify -> theme -> embed) still gets exercised.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN', 'ANALYST');
    const { channel } = await req.json();

    const pool = SIMULATED_CHANNELS[channel as keyof typeof SIMULATED_CHANNELS];
    if (!pool) {
      return NextResponse.json({ error: 'Unknown simulated channel' }, { status: 400 });
    }

    // Pull a random batch of 5-10 items to simulate a "new since last sync" pull.
    const batchSize = 5 + Math.floor(Math.random() * 6);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, batchSize);

    let imported = 0;
    for (const item of shuffled) {
      const feedback = await prisma.feedback.create({
        data: {
          content: item.content,
          channel,
          customerLabel: item.customerLabel,
          workspaceId: session.user.workspaceId,
        },
      });
      await classifyAndStore(feedback.id, session.user.workspaceId, feedback.content);
      imported++;
    }

    return NextResponse.json({ imported, channel });
  } catch (err) {
    return handleApiError(err);
  }
}
