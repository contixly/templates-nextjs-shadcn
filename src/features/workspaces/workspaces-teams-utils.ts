export const normalizeWorkspaceTeamName = (name: string) => name.trim();

export const normalizeWorkspaceTeamNameForComparison = (name: string) =>
  normalizeWorkspaceTeamName(name).toLowerCase();
