export const timeTools = {
  formatDate: (date: Date | string, locale: string = "en"): string =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date)),
  formatRelativeTime: (date: Date | string, locale: string = "en"): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    if (diffMins < 1) return formatter.format(0, "minute");
    if (diffMins < 60) return formatter.format(-diffMins, "minute");
    if (diffHours < 24) return formatter.format(-diffHours, "hour");
    if (diffDays < 7) return formatter.format(-diffDays, "day");

    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(then);
  },
};
