/**
 * Tokenizer results.
 */
interface LexToken {
  type: "OPEN" | "CLOSE" | "PATTERN" | "NAME" | "CHAR" | "ESCAPED_CHAR" | "MODIFIER" | "END";
  index: number;
  value: string;
}

/**
 * Tokenize input string.
 */
function lexer(str: string): LexToken[] {
  const tokens: LexToken[] = [];
  let i = 0;

  while (i < str.length) {
    const char = str[i];

    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }

    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }

    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }

    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }

    if (char === ":") {
      let name = "";
      let j = i + 1;

      while (j < str.length) {
        const code = str.charCodeAt(j);

        if (
          // `0-9`
          (code >= 48 && code <= 57) ||
          // `A-Z`
          (code >= 65 && code <= 90) ||
          // `a-z`
          (code >= 97 && code <= 122) ||
          // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }

        break;
      }

      if (!name) {
        throw new TypeError(`Missing parameter name at ${i}`);
      }

      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }

    if (char === "(") {
      let count = 1;
      let pattern = "";
      let j = i + 1;

      if (str[j] === "?") {
        throw new TypeError(`Pattern cannot start with "?" at ${j}`);
      }

      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }

        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError(`Capturing groups are not allowed at ${j}`);
          }
        }

        pattern += str[j++];
      }

      if (count) {
        throw new TypeError(`Unbalanced pattern at ${i}`);
      }
      if (!pattern) {
        throw new TypeError(`Missing pattern at ${i}`);
      }

      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }

    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }

  tokens.push({ type: "END", index: i, value: "" });

  return tokens;
}

export interface ParseOptions {
  /**
   * Set the default delimiter for repeat parameters. (default: `'/'`)
   */
  delimiter?: string;
  /**
   * List of characters to automatically consider prefixes when parsing.
   */
  prefixes?: string;
}

/**
 * Parse a string for the raw tokens.
 */
export function parse(str: string, options: ParseOptions = {}): Token[] {
  const tokens = lexer(str);
  const { prefixes = "./" } = options;
  const defaultPattern = `[^${escapeString(options.delimiter || "/#?")}]+?`;
  const result: Token[] = [];
  let key = 0;
  let i = 0;
  let path = "";

  const tryConsume = (type: LexToken["type"]): string | undefined => {
    if (i < tokens.length && tokens[i].type === type) {
      return tokens[i++].value;
    }
    return undefined;
  };

  const mustConsume = (type: LexToken["type"]): string => {
    const value = tryConsume(type);
    if (value !== undefined) {
      return value;
    }
    const { type: nextType, index } = tokens[i];
    throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}`);
  };

  const consumeText = (): string => {
    let result = "";
    let value: string | undefined;
    // tslint:disable-next-line
    while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
      result += value;
    }
    return result;
  };

  while (i < tokens.length) {
    const char = tryConsume("CHAR");
    const name = tryConsume("NAME");
    const pattern = tryConsume("PATTERN");

    if (name || pattern) {
      let prefix = char || "";

      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }

      if (path) {
        result.push(path);
        path = "";
      }

      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || "",
      });
      continue;
    }

    const value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }

    if (path) {
      result.push(path);
      path = "";
    }

    const open = tryConsume("OPEN");
    if (open) {
      const prefix = consumeText();
      const name = tryConsume("NAME") || "";
      const pattern = tryConsume("PATTERN") || "";
      const suffix = consumeText();

      mustConsume("CLOSE");

      result.push({
        name: name || (pattern ? key++ : ""),
        pattern: name && !pattern ? defaultPattern : pattern,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || "",
      });
      continue;
    }

    mustConsume("END");
  }

  return result;
}

/**
 * Escape a regular expression string.
 */
function escapeString(str: string) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}

/**
 * Get the flags for a regexp from the options.
 */
function flags(options?: { sensitive?: boolean }) {
  return options && options.sensitive ? "" : "i";
}

/**
 * Metadata about a key.
 */
export interface Key {
  name: string | number;
  prefix: string;
  suffix: string;
  pattern: string;
  modifier: string;
}

/**
 * A token is a string (nothing special) or key metadata (capture group).
 */
export type Token = string | Key;

/**
 * Pull out keys from a regexp.
 */
function regexpToRegexp(path: RegExp, keys?: Key[]): RegExp {
  if (!keys) {
    return path;
  }

  // Use a negative lookahead to match only capturing groups.
  const groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (let i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: "",
        suffix: "",
        modifier: "",
        pattern: "",
      });
    }
  }

  return path;
}

/**
 * Transform an array into a regexp.
 */
function arrayToRegexp(
  paths: Array<string | RegExp>,
  keys?: Key[],
  options?: TokensToRegexpOptions & ParseOptions
): RegExp {
  const parts = paths.map((path) => pathToRegexp(path, keys, options).source);
  return new RegExp(`(?:${parts.join("|")})`, flags(options));
}

/**
 * Create a path regexp from string input.
 */
function stringToRegexp(
  path: string,
  keys?: Key[],
  options?: TokensToRegexpOptions & ParseOptions
) {
  return tokensToRegexp(parse(path, options), keys, options);
}

export interface TokensToRegexpOptions {
  /**
   * When `true` the regexp will be case sensitive. (default: `false`)
   */
  sensitive?: boolean;
  /**
   * When `true` the regexp allows an optional trailing delimiter to match. (default: `false`)
   */
  strict?: boolean;
  /**
   * When `true` the regexp will match to the end of the string. (default: `true`)
   */
  end?: boolean;
  /**
   * When `true` the regexp will match from the beginning of the string. (default: `true`)
   */
  start?: boolean;
  /**
   * Sets the final character for non-ending optimistic matches. (default: `/`)
   */
  delimiter?: string;
  /**
   * List of characters that can also be "end" characters.
   */
  endsWith?: string;
  /**
   * Encode path tokens for use in the `RegExp`.
   */
  encode?: (value: string) => string;
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 */
export function tokensToRegexp(tokens: Token[], keys?: Key[], options: TokensToRegexpOptions = {}) {
  const { strict = false, start = true, end = true, encode = (x: string) => x } = options;
  const endsWith = `[${escapeString(options.endsWith || "")}]|$`;
  const delimiter = `[${escapeString(options.delimiter || "/#?")}]`;
  let route = start ? "^" : "";

  // Iterate over the tokens and create our regexp string.
  for (const token of tokens) {
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      const prefix = escapeString(encode(token.prefix));
      const suffix = escapeString(encode(token.suffix));

      if (token.pattern) {
        if (keys) {
          keys.push(token);
        }

        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            const mod = token.modifier === "*" ? "?" : "";
            route += `(?:${prefix}((?:${token.pattern})(?:${suffix}${prefix}(?:${token.pattern}))*)${suffix})${mod}`;
          } else {
            route += `(?:${prefix}(${token.pattern})${suffix})${token.modifier}`;
          }
        } else {
          route += `(${token.pattern})${token.modifier}`;
        }
      } else {
        route += `(?:${prefix}${suffix})${token.modifier}`;
      }
    }
  }

  if (end) {
    if (!strict) {
      route += `${delimiter}?`;
    }

    route += !options.endsWith ? "$" : `(?=${endsWith})`;
  } else {
    const endToken = tokens[tokens.length - 1];
    const isEndDelimited =
      typeof endToken === "string"
        ? delimiter.indexOf(endToken[endToken.length - 1]) > -1
        : // tslint:disable-next-line
          endToken === undefined;

    if (!strict) {
      route += `(?:${delimiter}(?=${endsWith}))?`;
    }

    if (!isEndDelimited) {
      route += `(?=${delimiter}|${endsWith})`;
    }
  }

  return new RegExp(route, flags(options));
}

/**
 * Supported `path-to-regexp` input types.
 */
export type Path = string | RegExp | Array<string | RegExp>;

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 */
export function pathToRegexp(
  path: Path,
  keys?: Key[],
  options?: TokensToRegexpOptions & ParseOptions
) {
  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys);
  }
  if (Array.isArray(path)) {
    return arrayToRegexp(path, keys, options);
  }
  return stringToRegexp(path, keys, options);
}
