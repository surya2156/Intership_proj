/**
 * Seed script — creates one demo workspace, one user per role, 120+ feedback
 * items pre-classified with sentiment/theme/feature-area, and their
 * embeddings, so the app is immediately demoable without needing to burn
 * API credits classifying everything on first run.
 *
 * Run with: npm run seed
 */
import { PrismaClient, Sentiment } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { embedText } from '../lib/search';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo1234!';

type SeedFeedback = {
  content: string;
  channel: string;
  customerLabel?: string;
  sentiment: Sentiment;
  sentimentScore: number;
  themes: string[];
  featureArea: string;
  daysAgo: number; // used to spread items across the last ~60 days
};

const CHANNELS = ['Support Ticket', 'App Store Review', 'NPS Survey', 'Sales Call Notes', 'Community Post'];

// A representative pool covering several themes, sentiments and channels,
// deliberately weighted so "Onboarding" and "Billing" spike in the most
// recent period to make the Trends page's spike detection visible.
const TEMPLATES: { text: string; theme: string; area: string; sentiment: Sentiment; score: number }[] = [
  { text: 'Onboarding took forever — I could not figure out how to invite my team.', theme: 'Onboarding', area: 'Onboarding', sentiment: 'NEG', score: -0.6 },
  { text: 'The new-user setup wizard skipped a step and I got stuck for 20 minutes.', theme: 'Onboarding', area: 'Onboarding', sentiment: 'NEG', score: -0.5 },
  { text: 'Onboarding was smooth for once, actually understood what to do.', theme: 'Onboarding', area: 'Onboarding', sentiment: 'POS', score: 0.6 },
  { text: 'Would help to have a short video walkthrough during signup.', theme: 'Onboarding', area: 'Onboarding', sentiment: 'NEU', score: 0.0 },
  { text: 'Inviting teammates during setup was confusing — no clear next step.', theme: 'Onboarding', area: 'Onboarding', sentiment: 'NEG', score: -0.4 },
  { text: 'Billing page keeps timing out when I try to download an invoice.', theme: 'Billing', area: 'Billing', sentiment: 'NEG', score: -0.7 },
  { text: 'Pricing feels steep for what we actually use day to day.', theme: 'Billing', area: 'Pricing', sentiment: 'NEG', score: -0.4 },
  { text: 'Wish invoices could be auto-forwarded to our finance inbox.', theme: 'Billing', area: 'Billing', sentiment: 'NEU', score: 0.0 },
  { text: 'Upgrading plans was surprisingly painless, kudos to the team.', theme: 'Billing', area: 'Billing', sentiment: 'POS', score: 0.5 },
  { text: 'Got double-charged this month, support fixed it fast though.', theme: 'Billing', area: 'Billing', sentiment: 'NEG', score: -0.3 },
  { text: 'The new dashboard is gorgeous and finally fast. Huge improvement.', theme: 'Dashboard & Reporting', area: 'Dashboard', sentiment: 'POS', score: 0.8 },
  { text: 'Reporting exports are clunky — we end up rebuilding charts elsewhere.', theme: 'Dashboard & Reporting', area: 'Reporting', sentiment: 'NEG', score: -0.5 },
  { text: 'Would love a way to pin favorite charts to the top of the dashboard.', theme: 'Dashboard & Reporting', area: 'Dashboard', sentiment: 'NEU', score: 0.1 },
  { text: 'Charts lag noticeably once we have a few thousand feedback items.', theme: 'Dashboard & Reporting', area: 'Performance', sentiment: 'NEG', score: -0.5 },
  { text: 'App crashes every time I try to export a report as PDF. Please fix.', theme: 'Mobile App', area: 'Mobile App', sentiment: 'NEG', score: -0.8 },
  { text: 'The mobile app finally feels as fast as the web version. Nice work.', theme: 'Mobile App', area: 'Mobile App', sentiment: 'POS', score: 0.7 },
  { text: 'App logs me out randomly, super annoying when I am mid-task.', theme: 'Mobile App', area: 'Mobile App', sentiment: 'NEG', score: -0.6 },
  { text: 'Dark mode please! Using this at night is rough on the eyes.', theme: 'Mobile App', area: 'Mobile App', sentiment: 'NEU', score: 0.0 },
  { text: 'Can we get offline mode? I travel a lot and lose connectivity often.', theme: 'Mobile App', area: 'Mobile App', sentiment: 'NEU', score: -0.1 },
  { text: 'Prospect wants SSO before they will sign — third time this month.', theme: 'Enterprise & Security', area: 'Security', sentiment: 'NEG', score: -0.3 },
  { text: 'They are blocked on the lack of a public API for custom integrations.', theme: 'Integrations', area: 'API', sentiment: 'NEG', score: -0.4 },
  { text: 'Asked whether we support custom roles beyond the standard three.', theme: 'Enterprise & Security', area: 'RBAC', sentiment: 'NEU', score: 0.0 },
  { text: 'Team loves the AI classification but wants confidence scores visible.', theme: 'AI Features', area: 'Classification', sentiment: 'POS', score: 0.4 },
  { text: 'The Ask LOOP feature is genuinely useful, better than I expected.', theme: 'AI Features', area: 'Ask LOOP', sentiment: 'POS', score: 0.7 },
  { text: 'AI sometimes mis-tags sarcasm as positive sentiment, worth a look.', theme: 'AI Features', area: 'Classification', sentiment: 'NEG', score: -0.3 },
  { text: 'Support team was incredibly responsive when we had an outage question.', theme: 'Support Experience', area: 'Support', sentiment: 'POS', score: 0.7 },
  { text: 'Waited two days for a reply on a fairly urgent ticket.', theme: 'Support Experience', area: 'Support', sentiment: 'NEG', score: -0.5 },
  { text: 'Customer asked again for a bulk-edit option in the inbox view.', theme: 'Inbox & Workflow', area: 'Inbox', sentiment: 'NEU', score: 0.0 },
  { text: 'Filtering by date range in the inbox is a lifesaver, use it daily.', theme: 'Inbox & Workflow', area: 'Inbox', sentiment: 'POS', score: 0.5 },
  { text: 'Status workflow (New/Reviewed/Actioned) keeps our team so organized now.', theme: 'Inbox & Workflow', area: 'Inbox', sentiment: 'POS', score: 0.6 },
  { text: 'Love the new export feature, saved me an hour today.', theme: 'Dashboard & Reporting', area: 'Reporting', sentiment: 'POS', score: 0.6 },
  { text: 'Wish there was a keyboard shortcut cheat sheet somewhere.', theme: 'Inbox & Workflow', area: 'Inbox', sentiment: 'NEU', score: 0.1 },
  { text: 'Just migrated from spreadsheets — this is already saving us so much time.', theme: 'Onboarding', area: 'Onboarding', sentiment: 'POS', score: 0.8 },
  { text: 'Great value, the automation features save us hours every week.', theme: 'AI Features', area: 'Automation', sentiment: 'POS', score: 0.7 },
  { text: 'Notifications fire way too often, I muted the app within a week.', theme: 'Inbox & Workflow', area: 'Notifications', sentiment: 'NEG', score: -0.4 },
];

function buildFeedbackPool(): SeedFeedback[] {
  const pool: SeedFeedback[] = [];
  let i = 0;
  // Repeat/spread templates across ~60 days and 5 channels to reach 120+ items,
  // weighting Onboarding & Billing toward the recent period (days 0-14) so
  // the Trends page shows a visible spike, per the brief's demo guidance.
  while (pool.length < 130) {
    const t = TEMPLATES[i % TEMPLATES.length];
    const recentWeighted = t.theme === 'Onboarding' || t.theme === 'Billing';
    const daysAgo = recentWeighted
      ? Math.floor(Math.random() * 14)
      : Math.floor(Math.random() * 60);

    pool.push({
      content: t.text,
      channel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)],
      customerLabel: ['SMB', 'Mid-market', 'Enterprise'][Math.floor(Math.random() * 3)],
      sentiment: t.sentiment,
      sentimentScore: t.score,
      themes: [t.theme],
      featureArea: t.area,
      daysAgo,
    });
    i++;
  }
  return pool;
}

async function main() {
  console.log('Seeding LOOP demo data...');

  await prisma.report.deleteMany({});
  await prisma.feedbackTheme.deleteMany({});
  await prisma.embedding.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.theme.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.workspace.deleteMany({});

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme SaaS Co.',
      users: {
        create: [
          { name: 'Ava Admin', email: 'admin@loop-demo.dev', passwordHash, role: 'ADMIN' },
          { name: 'Alex Analyst', email: 'analyst@loop-demo.dev', passwordHash, role: 'ANALYST' },
          { name: 'Val Viewer', email: 'viewer@loop-demo.dev', passwordHash, role: 'VIEWER' },
        ],
      },
    },
    include: { users: true },
  });

  const admin = workspace.users.find((u) => u.role === 'ADMIN')!;

  const themeColors: Record<string, string> = {
    Onboarding: '#6a5cf5',
    Billing: '#ef4444',
    'Dashboard & Reporting': '#0ea5e9',
    'Mobile App': '#f59e0b',
    'Enterprise & Security': '#8b5cf6',
    Integrations: '#14b8a6',
    'AI Features': '#ec4899',
    'Support Experience': '#22c55e',
    'Inbox & Workflow': '#64748b',
  };

  const themeRecords = new Map<string, string>();
  for (const [name, color] of Object.entries(themeColors)) {
    const theme = await prisma.theme.create({ data: { workspaceId: workspace.id, name, color } });
    themeRecords.set(name, theme.id);
  }

  const pool = buildFeedbackPool();

  for (const item of pool) {
    const createdAt = new Date(Date.now() - item.daysAgo * 86400000 - Math.random() * 86400000);

    const feedback = await prisma.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        customerLabel: item.customerLabel,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        featureArea: item.featureArea,
        status: Math.random() > 0.6 ? (Math.random() > 0.5 ? 'REVIEWED' : 'ACTIONED') : 'NEW',
        createdAt,
        workspaceId: workspace.id,
      },
    });

    for (const themeName of item.themes) {
      const themeId = themeRecords.get(themeName);
      if (themeId) {
        await prisma.feedbackTheme.create({
          data: { feedbackId: feedback.id, themeId, confidence: 0.85 + Math.random() * 0.15 },
        });
      }
    }

    await prisma.embedding.create({
      data: { feedbackId: feedback.id, vector: embedText(item.content) },
    });
  }

  console.log(`Seeded workspace "${workspace.name}" with ${pool.length} feedback items.`);
  console.log('Demo logins (all use password: ' + DEMO_PASSWORD + '):');
  console.log('  Admin   -> admin@loop-demo.dev');
  console.log('  Analyst -> analyst@loop-demo.dev');
  console.log('  Viewer  -> viewer@loop-demo.dev');
  console.log(`Admin user id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
