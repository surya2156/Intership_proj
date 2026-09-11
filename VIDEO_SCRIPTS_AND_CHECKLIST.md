# LOOP — Video Scripts & Submission Checklist

## 1. Demo Video (3–5 min) — talking points

Record your screen walking through the deployed app in this order. Speak like
you're pitching to a Head of Product, not narrating a class assignment.

1. **Hook (15s)** — "LOOP turns scattered customer feedback into a ranked,
   evidence-backed list of what to do next." Show the login screen.
2. **Login & roles (20s)** — Log in as Admin. Mention the three roles
   (Admin/Analyst/Viewer) and that they're enforced server-side, not just hidden
   buttons.
3. **Dashboard (30s)** — Point out the stat cards and the three charts (volume,
   sentiment, top themes). Change the date range to show it's live, not static.
4. **Inbox — ingestion (60s)** — Add one feedback item manually and show it get
   classified in real time (sentiment + theme appear). Upload a small CSV and
   show the imported/failed summary. Click a "Sync" button to show the
   simulated channel pulling in new items.
5. **Inbox — triage (30s)** — Filter by sentiment = Negative, change an item's
   status from New → Reviewed inline.
6. **Trends (30s)** — Show a theme flagged "spiking," click it to drill into the
   underlying feedback.
7. **Ask LOOP (45s)** — Ask a real question ("What are users saying about
   onboarding?"). Point out the answer cites specific feedback items, and that
   it says so if it can't find enough evidence — this is the retrieval-grounded
   part, not the model guessing.
8. **Reports (30s)** — Generate a Voice-of-Customer report, show the narrative
   plus the underlying stats it was built from.
9. **Close (15s)** — One sentence on the multi-tenant/RBAC architecture
   underneath, then say what you'd build next if you had another week.

**Recording tips:** use your OS's built-in screen recorder (Windows Game Bar,
macOS Cmd+Shift+5, or OBS), 1080p, and upload as an unlisted YouTube video or a
shared Google Drive link per the submission form.

## 2. Self-Feedback Video (1–2 min) — talking points

This is a short, honest reflection — not a second demo.

1. What you built and what you're proud of.
2. One or two genuinely hard problems you ran into (e.g., enforcing tenant
   isolation on every query, getting Claude to return reliable structured JSON,
   keeping the AI report from inventing numbers) and how you solved them.
3. One thing you'd do differently with more time.
4. One thing you learned that you didn't expect to.

Keep it conversational and specific to your own build — generic answers are
obvious to a grader.

## 3. Submission Checklist

| # | Item | Marks | Status |
|---|------|-------|--------|
| 1 | Source code (GitHub/GitLab repo, or Drive/Dropbox folder) | 5 | Source generated — push `loop-source-code.zip` contents to a repo |
| 2 | Live deployment URL (Vercel) | 5 | Pending — see README §4 "Deploying to Vercel" |
| 3 | Demo video (unlisted YouTube / Drive) | 4 | Pending — script above |
| 4 | Self-feedback video | 4 | Pending — script above |
| 5 | Project report | 2 | Done — `Project_LOOP_Report.docx` |

### Fastest path to a live deployment
```bash
npm install
npx vercel login
npx vercel            # first deploy, follow prompts
# In the Vercel dashboard: Project Settings -> Environment Variables, add
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ANTHROPIC_API_KEY
npx prisma migrate deploy
npm run seed           # populates demo data on the production DB
npx vercel --prod
```

### Before you record the demo
- Confirm `npm run seed` has run against the DB your deployment points to, so
  the app isn't empty on camera.
- Log in once as each of the three demo roles beforehand to make sure
  credentials work (see README §5).
