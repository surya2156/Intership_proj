type SeedItem = { content: string; customerLabel?: string };

export const SIMULATED_CHANNELS: Record<string, SeedItem[]> = {
  'App Store Review': [
    { content: 'The new dashboard is gorgeous and finally fast. Huge improvement.', customerLabel: 'iOS user' },
    { content: 'Crashes every time I try to export a report as PDF. Please fix.', customerLabel: 'iOS user' },
    { content: 'Love the redesign but the search bar is way too small on my phone.', customerLabel: 'Android user' },
    { content: 'Five stars. Onboarding was smooth for once, actually understood what to do.', customerLabel: 'iOS user' },
    { content: 'App logs me out randomly, super annoying when I am mid-task.', customerLabel: 'Android user' },
    { content: 'Dark mode please! Using this at night is rough on the eyes.', customerLabel: 'iOS user' },
    { content: 'Great tool overall but notifications are way too frequent.', customerLabel: 'Android user' },
    { content: 'The mobile app finally feels as fast as the web version. Nice work.', customerLabel: 'iOS user' },
    { content: 'Can we get offline mode? I travel a lot and lose connectivity often.', customerLabel: 'Android user' },
    { content: 'Billing page keeps timing out when I try to download an invoice.', customerLabel: 'iOS user' },
  ],
  'NPS Survey': [
    { content: 'It does the job, but the mobile experience needs work.', customerLabel: 'Mid-market' },
    { content: 'Support team was incredibly responsive when we had an outage question.', customerLabel: 'Enterprise' },
    { content: 'Pricing feels steep for what we actually use day to day.', customerLabel: 'SMB' },
    { content: 'We would recommend it, but onboarding for new teammates is confusing.', customerLabel: 'Mid-market' },
    { content: 'Reporting exports are clunky — we end up rebuilding charts elsewhere.', customerLabel: 'Enterprise' },
    { content: 'Solid product. Would love native Slack notifications for new items.', customerLabel: 'SMB' },
    { content: 'Onboarding took forever — I could not figure out how to invite my team.', customerLabel: 'SMB' },
    { content: 'Great value, the automation features save us hours every week.', customerLabel: 'Mid-market' },
  ],
  'Sales Call Notes': [
    { content: 'Prospect wants SSO before they will sign — third time this month.', customerLabel: 'Prospect - Enterprise' },
    { content: 'Customer asked again for a bulk-edit option in the inbox view.', customerLabel: 'Existing - Mid-market' },
    { content: 'They are blocked on the lack of a public API for custom integrations.', customerLabel: 'Prospect - Enterprise' },
    { content: 'Team loves the AI classification but wants confidence scores visible.', customerLabel: 'Existing - Mid-market' },
    { content: 'Asked whether we support custom roles beyond the standard three.', customerLabel: 'Prospect - Mid-market' },
  ],
  'Community Post': [
    { content: 'Love the new export feature, saved me an hour today.', customerLabel: 'Community member' },
    { content: 'Anyone else notice the trends chart lagging on large workspaces?', customerLabel: 'Community member' },
    { content: 'The Ask LOOP feature is genuinely useful, better than I expected.', customerLabel: 'Community member' },
    { content: 'Wish there was a keyboard shortcut cheat sheet somewhere.', customerLabel: 'Community member' },
    { content: 'Just migrated from spreadsheets — this is already saving us so much time.', customerLabel: 'Community member' },
  ],
};
