import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  workspaceName: z.string().min(1).max(120),
});

export const feedbackCreateSchema = z.object({
  content: z.string().min(1).max(4000),
  channel: z.string().min(1).max(60),
  sourceRef: z.string().max(200).optional(),
  customerLabel: z.string().max(200).optional(),
});

export const feedbackUpdateSchema = z.object({
  status: z.enum(['NEW', 'REVIEWED', 'ACTIONED']).optional(),
});

export const feedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  channel: z.string().optional(),
  sentiment: z.enum(['POS', 'NEU', 'NEG']).optional(),
  status: z.enum(['NEW', 'REVIEWED', 'ACTIONED']).optional(),
  themeId: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const askSchema = z.object({
  question: z.string().min(3).max(500),
});

export const reportGenerateSchema = z.object({
  periodDays: z.coerce.number().int().min(1).max(365).default(30),
  title: z.string().min(1).max(200).optional(),
});

export const memberInviteSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']),
});

// Structured output we require back from Claude for classification (AI1).
export const classificationSchema = z.object({
  sentiment: z.enum(['POS', 'NEU', 'NEG']),
  sentimentScore: z.number().min(-1).max(1),
  themes: z.array(z.string()).min(1).max(3),
  featureArea: z.string().min(1).max(60),
  rationale: z.string().max(300),
});
