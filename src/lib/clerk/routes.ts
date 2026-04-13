import { pathToRegexp } from "@lib/clerk/path-to-regexp";
import { NextRequest } from "next/server";
import Link from "next/link";

/**
 * Enables autocompletion for a union type while keeping the ability to use any string
 * or type of `T`
 *
 * @internal
 */
type Autocomplete<U extends T, T = string> = U | (T & Record<never, never>);
type WithPathPatternWildcard<T = string> = `${T & string}(.*)`;
type PathPattern = Autocomplete<WithPathPatternWildcard>;
type PathMatcherParam = Array<RegExp | PathPattern> | RegExp | PathPattern;

const precomputePathRegex = (patterns: Array<string | RegExp>) => {
  return patterns.map((pattern) => (pattern instanceof RegExp ? pattern : pathToRegexp(pattern)));
};

/**
 * Creates a function that matches paths against a set of patterns.
 *
 * @param patterns - A string, RegExp, or array of patterns to match against
 * @returns A function that takes a pathname and returns true if it matches any of the patterns
 */
const createPathMatcher = (patterns: PathMatcherParam) => {
  const routePatterns = [patterns || ""].flat().filter(Boolean);
  const matchers = precomputePathRegex(routePatterns);
  return (pathname: string) => matchers.some((matcher) => matcher.test(pathname));
};

type NextTypedRoute<T = Parameters<typeof Link>["0"]["href"]> = T extends string ? T : never;
type RouteMatcherWithNextTypedRoutes = Autocomplete<
  WithPathPatternWildcard<NextTypedRoute> | NextTypedRoute
>;

export type RouteMatcherParam =
  | Array<RegExp | RouteMatcherWithNextTypedRoutes>
  | RegExp
  | RouteMatcherWithNextTypedRoutes
  | ((req: NextRequest) => boolean);

/**
 * Returns a function that accepts a `Request` object and returns whether the request matches the list of
 * predefined routes that can be passed in as the first argument.
 *
 * You can use glob patterns to match multiple routes or a function to match against the request object.
 * Path patterns and regular expressions are supported, for example: `['/foo', '/bar(.*)'] or `[/^\/foo\/.*$/]`
 * For more information, see: https://clerk.com/docs
 */
export const createRouteMatcher = (routes: RouteMatcherParam): ((req: NextRequest) => boolean) => {
  if (typeof routes === "function") {
    return (req: NextRequest) => routes(req);
  }

  return (req: NextRequest) => createPathMatcher(routes)(req.nextUrl.pathname);
};
