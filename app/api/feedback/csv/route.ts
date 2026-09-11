import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api';
import { classifyAndStore } from '@/app/api/feedback/route';

/**
 * Expected CSV columns (header row required):
 *   content, channel, customer_label, created_at
 * (sentiment/themes are intentionally left blank — the AI classifier fills
 * them on import, per brief Appendix A.)
 */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
    return row;
  });
}

// Minimal CSV cell splitter that respects double-quoted fields containing commas.
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN', 'ANALYST');
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCsv(text);

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [i, row] of rows.entries()) {
      if (!row.content || !row.channel) {
        failed++;
        errors.push(`Row ${i + 2}: missing required "content" or "channel"`);
        continue;
      }
      try {
        const feedback = await prisma.feedback.create({
          data: {
            content: row.content.slice(0, 4000),
            channel: row.channel.slice(0, 60),
            customerLabel: row.customer_label || undefined,
            workspaceId: session.user.workspaceId,
            ...(row.created_at ? { createdAt: new Date(row.created_at) } : {}),
          },
        });
        await classifyAndStore(feedback.id, session.user.workspaceId, feedback.content);
        imported++;
      } catch (e) {
        failed++;
        errors.push(`Row ${i + 2}: ${(e as Error).message}`);
      }
    }

    return NextResponse.json({ imported, failed, total: rows.length, errors: errors.slice(0, 20) });
  } catch (err) {
    return handleApiError(err);
  }
}
