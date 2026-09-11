import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { askSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/api';
import { answerFromFeedback } from '@/lib/ai';
import { embedText, retrieveTopK } from '@/lib/search';

// AI3 — "Ask LOOP": retrieve-then-answer, grounded, cites the items it used.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { question } = askSchema.parse(await req.json());

    // Pull this workspace's embeddings only (tenant isolation).
    const embeddings = await prisma.embedding.findMany({
      where: { feedback: { workspaceId: session.user.workspaceId } },
      include: { feedback: true },
    });

    if (embeddings.length === 0) {
      return NextResponse.json({
        answer:
          "There's no feedback in this workspace yet, so I don't have anything to ground an answer in. Ingest some feedback first.",
        sources: [],
      });
    }

    const questionVector = embedText(question);
    const candidates = embeddings.map((e) => ({
      id: e.feedbackId,
      content: e.feedback.content,
      channel: e.feedback.channel,
      sentiment: e.feedback.sentiment,
      vector: e.vector as number[],
    }));

    const top = retrieveTopK(questionVector, candidates, 6).filter((c) => c.score > 0.05);

    const answer = await answerFromFeedback(
      question,
      top.map((t) => ({ id: t.id, content: t.content, channel: t.channel, sentiment: t.sentiment }))
    );

    return NextResponse.json({
      answer,
      sources: top.map((t) => ({
        id: t.id,
        content: t.content,
        channel: t.channel,
        sentiment: t.sentiment,
        relevance: Math.round(t.score * 100) / 100,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
