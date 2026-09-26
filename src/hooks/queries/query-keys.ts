export const queryKeys = {
  users: {
    all: ['users'] as const,
    deleted: ['users', 'deleted'] as const,
    detail: (id: string) => ['users', id] as const,
    deletionImpact: (id: string) => ['users', id, 'deletion-impact'] as const,
  },
  organizations: {
    list: (query?: unknown) => ['organizations', query] as const,
    detail: (id: string) => ['organizations', id] as const,
  },
  managers: {
    all: ['managers'] as const,
    detail: (id: string) => ['managers', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
    managers: (id: string) => ['projects', id, 'managers'] as const,
  },
  team: {
    list: (query?: unknown) => ['team-members', query] as const,
    detail: (id: string) => ['team-members', id] as const,
  },
  leads: {
    list: (query?: unknown) => ['leads', query] as const,
    detail: (id: string) => ['leads', id] as const,
    teamPerformance: ['leads', 'team-performance'] as const,
    // Under the 'leads' prefix on purpose: every lead mutation's
    // invalidateQueries(['leads']) refreshes the nav dot too.
    unseenCount: ['leads', 'unseen-count'] as const,
  },
  employees: {
    teamSummary: ['employees', 'team-summary'] as const,
    teamRollup: ['employees', 'team-rollup'] as const,
    summary: (id: string) => ['employees', id, 'summary'] as const,
    profile: (id: string) => ['employees', id, 'profile'] as const,
    overview: (id: string) => ['employees', id, 'overview'] as const,
  },
  attendance: {
    today: ['attendance', 'today'] as const,
    mine: (query?: unknown) => ['attendance', 'me', query] as const,
    team: (date?: string) => ['attendance', 'team', date] as const,
    org: (date?: string) => ['attendance', 'org', date] as const,
    forEmployee: (id: string, query?: unknown) => ['attendance', id, query] as const,
  },
  leave: {
    mine: ['leave', 'me'] as const,
    teamPending: ['leave', 'team', 'pending'] as const,
    org: (status?: string) => ['leave', 'org', status] as const,
  },
  targets: {
    mine: (query?: unknown) => ['targets', 'me', query] as const,
    team: (query?: unknown) => ['targets', 'team', query] as const,
  },
  integrations: {
    all: ['platform-integrations'] as const,
    detail: (id: string) => ['platform-integrations', id] as const,
  },
  leadAllocation: {
    settings: ['lead-allocation', 'settings'] as const,
  },
  whatsappIntegration: {
    detail: ['whatsapp-integration'] as const,
  },
  whatsappChat: {
    inbox: ['whatsapp-chat', 'inbox'] as const,
    thread: (leadId: string) => ['whatsapp-chat', leadId] as const,
  },
  activities: {
    mine: (date?: string) => ['activities', 'me', date] as const,
    team: (date?: string) => ['activities', 'team', date] as const,
    org: (date?: string) => ['activities', 'org', date] as const,
    report: (query?: unknown) => ['activities', 'report', query] as const,
  },
  tasks: {
    mine: (query?: unknown) => ['tasks', 'me', query] as const,
    assignedByMe: (query?: unknown) => ['tasks', 'assigned-by-me', query] as const,
    detail: (id: string) => ['tasks', id] as const,
  },
  notifications: {
    list: (unreadOnly?: boolean) => ['notifications', unreadOnly] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
}
