"use client";

import { IconFileText, IconSearch, IconTextCaption } from "@tabler/icons-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Kbd, KbdGroup } from "@components/ui/kbd";
import { cn } from "@lib/utils";
import { DOCUMENTS_SYSTEM_LOG_SCOPE } from "@features/documents-system/documents-system-consts";
import routes from "@features/documents-system/documents-system-routes";
import { DocumentsSystemSearchResponse } from "@features/documents-system/documents-system-search-types";

const SEARCH_DEBOUNCE_MS = 250;

const emptySearchResponse: DocumentsSystemSearchResponse = {
  pages: [],
  headings: [],
};

const getSearchApiPath = (query: string, locale: string) =>
  routes.api.search({ query: { q: query, locale } });

const getResultCount = (results: DocumentsSystemSearchResponse) =>
  results.pages.length + results.headings.length;

const useDebouncedValue = (value: string, delayMs: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
};

type SearchStatus = "idle" | "success" | "error";

export const DocumentsSystemSearch = ({ className }: { className?: string }) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("documentsSystem.ui.search");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocumentsSystemSearchResponse>(emptySearchResponse);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [pending, setPending] = useState(false);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const hasResults = getResultCount(results) > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      setOpen((currentOpen) => {
        const nextOpen = !currentOpen;

        if (nextOpen) {
          setPending(true);
        } else {
          setQuery("");
          setPending(false);
          setStatus("idle");
          setResults(emptySearchResponse);
        }

        return nextOpen;
      });
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();

    fetch(getSearchApiPath(debouncedQuery, locale), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Search request failed with status ${response.status}`);
        }

        return (await response.json()) as DocumentsSystemSearchResponse;
      })
      .then((payload) => {
        setResults({
          pages: Array.isArray(payload.pages) ? payload.pages : [],
          headings: Array.isArray(payload.headings) ? payload.headings : [],
        });
        setStatus("success");
        setPending(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error(`[${DOCUMENTS_SYSTEM_LOG_SCOPE}] search request failed`, error);
        setResults(emptySearchResponse);
        setStatus("error");
        setPending(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, locale, open]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      setPending(true);
      return;
    }

    setQuery("");
    setPending(false);
    setStatus("idle");
    setResults(emptySearchResponse);
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setPending(true);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      setPending(false);
      setStatus("idle");
      setResults(emptySearchResponse);
      router.push(href);
    },
    [router]
  );

  const error = status === "error";
  const emptyMessage = useMemo(
    () => (query.trim() ? t("emptyResults") : t("emptyQuery")),
    [query, t]
  );
  const resultsBlocked = pending && hasResults;

  return (
    <>
      <Button
        aria-label={t("openLabel")}
        className={cn(
          "text-muted-foreground h-9 w-9 justify-center px-0 sm:w-auto sm:min-w-24 sm:px-3 xl:w-[min(22rem,calc(100vw-8rem))] xl:justify-start",
          className
        )}
        type="button"
        variant="outline"
        onClick={() => handleOpenChange(true)}
      >
        <IconSearch className="sm:hidden xl:block" data-icon="inline-start" />
        <span className="hidden min-w-0 flex-1 truncate text-left xl:block">
          {t("placeholder")}
        </span>
        <KbdGroup className="hidden sm:inline-flex xl:ml-auto">
          <Kbd>Ctrl/⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-2xl" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <Command shouldFilter={false} loop>
            <CommandInput
              placeholder={t("placeholder")}
              value={query}
              onValueChange={handleQueryChange}
            />
            <CommandList
              aria-busy={pending}
              className={cn("max-h-[min(28rem,calc(100vh-12rem))]", pending && "cursor-wait")}
            >
              {error && (
                <div
                  aria-disabled={pending || undefined}
                  className={cn("text-muted-foreground px-4 py-6 text-sm", pending && "opacity-60")}
                >
                  {t("unavailable")}
                </div>
              )}

              {!error && !hasResults && <CommandEmpty>{emptyMessage}</CommandEmpty>}

              {!error && results.pages.length > 0 && (
                <CommandGroup heading={t("pages")}>
                  {results.pages.map((page) => (
                    <CommandItem
                      disabled={resultsBlocked}
                      key={page.href}
                      value={`page-${page.href}-${page.title}`}
                      onSelect={() => handleSelect(page.href)}
                    >
                      <IconFileText aria-hidden="true" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate font-medium">{page.title}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {page.group} · {page.parentItem}
                        </span>
                      </div>
                      <CommandShortcut>↵</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!error && results.pages.length > 0 && results.headings.length > 0 && (
                <CommandSeparator />
              )}

              {!error && results.headings.length > 0 && (
                <CommandGroup heading={t("headings")}>
                  {results.headings.map((heading) => (
                    <CommandItem
                      disabled={resultsBlocked}
                      key={heading.href}
                      value={`heading-${heading.href}-${heading.title}`}
                      onSelect={() => handleSelect(heading.href)}
                    >
                      <IconTextCaption aria-hidden="true" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate font-medium">{heading.title}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {heading.pageTitle}
                        </span>
                      </div>
                      <CommandShortcut>↵</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
};
