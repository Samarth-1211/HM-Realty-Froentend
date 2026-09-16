export const queryKeys = {
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
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
  },
  employees: {
    teamSummary: ['employees', 'team-summary'] as const,
    summary: (id: string) => ['employees', id, 'summary'] as const,
  },
  integrations: {
    all: ['platform-integrations'] as const,
    detail: (id: string) => ['platform-integrations', id] as const,
  },
  leadAllocation: {
    settings: ['lead-allocation', 'settings'] as const,
  },
}
