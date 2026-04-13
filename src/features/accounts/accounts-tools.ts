export const accountsTools = {
  /**
   * Extracts the initials from a given name.
   *
   * Splits the provided name into words, takes the first character
   * of each word, converts them to uppercase, and returns the first
   * two characters.
   *
   * @param {string} name - The full name from which to generate initials.
   * @returns {string} A string consisting of the first two initials in uppercase.
   */
  getInitials: (name: string): string =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
};
