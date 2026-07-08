# documents-system Specification

## Purpose
Define the public documentation system runtime: document discovery, metadata contracts, locale variants, visibility rules, navigation, MDX rendering, internal link handling, search, and share metadata.

## Requirements
### Requirement: Public Documentation Routes
The system SHALL expose the documentation surface as public Next.js routes rooted at `/docs`.

#### Scenario: Documentation home page renders the index document
- **GIVEN** a visible documentation document exists for the canonical `index` URL
- **WHEN** a visitor opens `/docs`
- **THEN** the system renders that document inside the documentation page layout
- **AND** the page uses the document title and description as route metadata

#### Scenario: Documentation catch-all page renders canonical document paths
- **GIVEN** a visible documentation document exists for a canonical URL
- **WHEN** a visitor opens `/docs/:slug`
- **THEN** the system resolves `:slug` to the canonical document URL
- **AND** renders the matching document inside the documentation page layout

#### Scenario: Missing or invisible document returns not found
- **GIVEN** no visible documentation document exists for a requested canonical URL
- **WHEN** a visitor opens the corresponding `/docs` route
- **THEN** the system MUST render the application not-found behavior for that route

#### Scenario: Documentation routes are public
- **GIVEN** a visitor is not authenticated
- **WHEN** the visitor opens `/docs` or a nested `/docs` route
- **THEN** the system allows the route through the public route boundary
- **AND** does not require a browser session to read public documentation

#### Scenario: Sitemap includes visible documentation routes
- **GIVEN** visible documentation documents exist in the registry
- **WHEN** the application sitemap is generated
- **THEN** the system includes `/docs` for the canonical `index` document
- **AND** includes nested `/docs/:slug` URLs for visible non-index documents
- **AND** does not include locale suffixes in generated documentation URLs

### Requirement: Documentation Shell
The system SHALL render documentation pages inside a shared documentation shell with sidebar navigation, breadcrumb, search, home navigation, and theme controls.

#### Scenario: Shell uses visible documents for the sidebar
- **GIVEN** the documentation layout is rendering for a locale
- **WHEN** the sidebar menu is built
- **THEN** the system loads visible documents for that locale
- **AND** groups them into sidebar sections from document metadata

#### Scenario: Sidebar open state uses the sidebar cookie
- **GIVEN** a sidebar state cookie is present
- **WHEN** the documentation layout renders
- **THEN** the shell initializes the sidebar open state from that cookie

#### Scenario: Mobile sidebar closes after document navigation
- **GIVEN** the documentation sidebar is open in the mobile sheet
- **WHEN** the visitor selects a document link
- **THEN** the mobile sidebar sheet closes after the selection

#### Scenario: Header renders document navigation tools
- **GIVEN** the documentation shell is visible
- **WHEN** the header renders
- **THEN** it includes a sidebar trigger, documentation breadcrumb, search command, application home link, and theme switcher

#### Scenario: Breadcrumb follows the current document marker
- **GIVEN** a rendered document exposes group, parent item, and title in the page marker
- **WHEN** the documentation breadcrumb updates on the client
- **THEN** it displays the current document group, parent item, and title outside the home page

### Requirement: Document Registry
The system SHALL build a documentation registry from local markdown and MDX content files using validated frontmatter metadata.

#### Scenario: Valid document metadata is accepted
- **GIVEN** a content file has non-empty `title`, `description`, `group`, and `parentItem`
- **AND** it has finite numeric `order`
- **AND** it has a supported `status`
- **AND** it has boolean `toc`
- **WHEN** the registry reads the file
- **THEN** the system includes the file as a document variant

#### Scenario: Invalid document metadata is skipped
- **GIVEN** a content file is missing required metadata or uses invalid metadata types
- **WHEN** the registry reads the file
- **THEN** the system skips that file from the document registry
- **AND** logs a documents-system warning for the skipped source path

#### Scenario: Optional metadata is preserved when valid
- **GIVEN** a content file provides optional valid `purpose`, `groupOrder`, `parentItemOrder`, `author`, `version`, `hide`, `editedAt`, `reading`, or `source`
- **WHEN** the registry validates metadata
- **THEN** the system preserves those values on the document metadata

#### Scenario: Reading time is computed when absent
- **GIVEN** a valid document has no explicit `reading` metadata
- **WHEN** the registry reads the document source
- **THEN** the system computes a minimum one-minute reading estimate from source text
- **AND** formats the reading label with the requested registry locale

#### Scenario: Edited date falls back from git to filesystem time
- **GIVEN** a valid document has no explicit `editedAt` metadata
- **WHEN** the registry enriches the metadata
- **THEN** it first tries the last git commit date for the content file
- **AND** falls back to filesystem modification date when git has no date
- **AND** falls back to the current date when neither source is available

### Requirement: Canonical URLs And Locale Variants
The system SHALL derive canonical document URLs from content paths and resolve localized variants by requested locale.

#### Scenario: Locale suffix is removed from canonical URL
- **GIVEN** a content source path contains a supported locale suffix before `.md` or `.mdx`
- **WHEN** the content path is parsed
- **THEN** the system records the explicit content locale
- **AND** removes the locale suffix from the canonical source path and canonical URL

#### Scenario: Index files map to their parent canonical URL
- **GIVEN** a content source path ends with `index.md` or `index.mdx`
- **WHEN** the content path is parsed
- **THEN** the canonical URL is the parent path
- **AND** the root index document canonical URL is `index`

#### Scenario: Unsupported locale suffix fails clearly
- **GIVEN** a content source path has a locale-looking suffix that is not supported by the application locales
- **WHEN** the content path is parsed
- **THEN** the system MUST throw an unsupported documents-system content locale error

#### Scenario: Unsuffixed content uses the configured default locale
- **GIVEN** a content source path does not include an explicit locale suffix
- **WHEN** the content path is parsed
- **THEN** the system assigns the configured public default locale as the content locale
- **AND** falls back to the application default locale when the configured value is empty or unsupported

#### Scenario: Requested locale selects the matching variant
- **GIVEN** multiple variants exist for one canonical URL
- **WHEN** a registry is resolved for a requested locale
- **THEN** the system selects the variant whose content locale matches the requested locale
- **AND** marks the document as not using locale fallback

#### Scenario: Missing requested locale falls back deterministically
- **GIVEN** no variant exists for the requested locale
- **WHEN** a registry is resolved for that locale
- **THEN** the system selects an unsuffixed variant when available
- **AND** otherwise selects the configured default locale variant when available
- **AND** otherwise selects the first available variant in application locale order
- **AND** marks the document as using locale fallback

#### Scenario: Duplicate locale variants are rejected
- **GIVEN** two variants have the same canonical URL and content locale
- **WHEN** the registry resolves document variants
- **THEN** the system MUST throw a duplicate documents-system content locale error
- **AND** include the canonical URL, locale, and conflicting source paths in the error

### Requirement: Visibility And Status Rules
The system SHALL separate all registry documents from the visible public document set using environment-specific status and hide rules.

#### Scenario: Production shows only publishable statuses
- **GIVEN** the documentation environment is production
- **WHEN** visible documents are selected
- **THEN** the system includes documents whose status is `published` or `archived`
- **AND** excludes documents with `hide: true`
- **AND** excludes documents whose status is `draft` or `review`

#### Scenario: Local environment shows all valid documents
- **GIVEN** the documentation environment is local
- **WHEN** visible documents are selected
- **THEN** the system includes every valid registry document regardless of status or `hide`

#### Scenario: Local environment marks non-default statuses
- **GIVEN** the documentation environment is local
- **WHEN** page metadata or sidebar items are rendered
- **THEN** `draft`, `review`, and `archived` documents expose matching status tones
- **AND** `published` documents use the default tone

#### Scenario: Production hides draft and review tones
- **GIVEN** the documentation environment is production
- **WHEN** page metadata or sidebar items are rendered
- **THEN** only `archived` documents expose the archived tone
- **AND** other visible documents use the default tone

#### Scenario: Hidden-in-production marker is local-only
- **GIVEN** a valid document has `hide: true`
- **WHEN** the documentation environment is local
- **THEN** page metadata and sidebar data mark the document as hidden in production
- **AND** the document remains accessible locally

### Requirement: Ordering And Navigation
The system SHALL sort documents and derive sidebar and previous/next navigation from document metadata.

#### Scenario: Documents sort by group and parent order
- **GIVEN** documents have group, parent item, and document order metadata
- **WHEN** the document list is sorted
- **THEN** the system sorts by descending effective group order
- **AND** then by group label
- **AND** then by descending effective parent item order
- **AND** then by parent item label
- **AND** then by descending document order
- **AND** then by document title

#### Scenario: Sidebar groups documents by metadata
- **GIVEN** a sorted visible document list
- **WHEN** sidebar menu items are built
- **THEN** the system groups links by document group
- **AND** groups child links by parent item
- **AND** uses document titles and canonical documentation hrefs for links

#### Scenario: Parent status mix reflects local draft and review state
- **GIVEN** a sidebar parent group contains draft and review documents
- **WHEN** the documentation environment is local
- **THEN** the parent status mix reflects draft, review, or both states

#### Scenario: Previous and next navigation uses sorted visible documents
- **GIVEN** a current document exists in the sorted visible document list
- **WHEN** page navigation is built
- **THEN** the previous item points to the document immediately before it when present
- **AND** the next item points to the document immediately after it when present

#### Scenario: Navigation is empty for unknown current path
- **GIVEN** a current document path is not present in the sorted visible document list
- **WHEN** page navigation is built
- **THEN** previous and next navigation are both empty

### Requirement: Static Parameters
The system SHALL generate static parameters for visible non-index documentation documents using canonical slugs only.

#### Scenario: Index document is omitted from catch-all static params
- **GIVEN** the visible document list includes the canonical `index` document
- **WHEN** static parameters are built for `/docs/[...slug]`
- **THEN** the `index` document is not included in the generated catch-all params

#### Scenario: Canonical slugs become static params
- **GIVEN** a visible non-index document has a canonical slug array
- **WHEN** static parameters are built
- **THEN** the system returns that slug array as a route parameter

#### Scenario: Locale-suffixed slug segments are rejected
- **GIVEN** a document slug contains a segment ending with a supported locale suffix
- **WHEN** static parameters are built
- **THEN** the system MUST throw an error requiring canonical slugs without locale suffixes

### Requirement: MDX Rendering Components
The system SHALL render markdown and MDX content through the documentation MDX component map.

#### Scenario: MDX content receives a documentation component map
- **GIVEN** a document page imports the selected MDX module
- **WHEN** the page renders the module
- **THEN** the system passes a documentation MDX component map with link context and localized UI labels

#### Scenario: H1 headings are hidden
- **GIVEN** MDX content contains an `h1`
- **WHEN** the documentation MDX component map renders it
- **THEN** the system hides the `h1` because the page shell owns the visible page title

#### Scenario: H2 and H3 headings receive stable anchors
- **GIVEN** MDX content contains `h2` or `h3` headings without explicit IDs
- **WHEN** the documentation MDX component map renders them
- **THEN** the system derives IDs from normalized heading text
- **AND** uses those IDs for heading anchors

#### Scenario: H2 headings expose share controls
- **GIVEN** an `h2` heading is rendered in a documentation page
- **WHEN** the heading is visible
- **THEN** the system renders a copy-link control for that heading
- **AND** copies the current page URL with the heading hash when activated

#### Scenario: Code blocks expose copy controls
- **GIVEN** MDX content contains a fenced code block
- **WHEN** the documentation MDX component map renders the block
- **THEN** the system wraps it in a styled code block surface
- **AND** provides a copy control for the code text

#### Scenario: Images use measured local dimensions
- **GIVEN** MDX content renders an image with a local public path
- **WHEN** the documentation image component renders it
- **THEN** the system reads the local image dimensions with the static image size helper
- **AND** falls back to `1600x900` when dimensions cannot be read

### Requirement: Page Metadata And Table Of Contents
The system SHALL render document metadata, optional table of contents, and page navigation around each document body.

#### Scenario: Page header displays document metadata
- **GIVEN** a document page is rendered
- **WHEN** the page header is built
- **THEN** it displays the document title and description
- **AND** exposes group and parent item metadata
- **AND** displays optional purpose, edited date, author, version, reading time, status, hidden-in-production, and fallback language fields when present

#### Scenario: Fallback language marker appears only for fallback content
- **GIVEN** a requested locale uses a document variant from another content locale
- **WHEN** page metadata renders
- **THEN** the system displays a fallback language marker for the content locale

#### Scenario: Matching locale does not show fallback language marker
- **GIVEN** the selected document content locale matches the requested locale
- **WHEN** page metadata renders
- **THEN** the system does not display a fallback language marker

#### Scenario: Date-only edited metadata keeps the authored calendar day
- **GIVEN** a document has date-only `editedAt` metadata such as `2026-07-06`
- **WHEN** page metadata formats the edited date for a visitor locale
- **THEN** the displayed calendar day remains the authored date regardless of the visitor timezone

#### Scenario: Table of contents follows H2 headings
- **GIVEN** a document has `toc` enabled
- **WHEN** the rendered content contains H2 headings with IDs
- **THEN** the system builds a table of contents from unique H2 anchors
- **AND** updates the active item while the visitor scrolls

#### Scenario: Table of contents can be disabled
- **GIVEN** a document has `toc: false`
- **WHEN** the page renders
- **THEN** the system does not render the table of contents menu

#### Scenario: Generated heading IDs are normalized after client render
- **GIVEN** the rendered content contains generated H2 or H3 IDs
- **WHEN** the table of contents component inspects the content container
- **THEN** the system normalizes duplicate generated IDs to stable unique IDs

#### Scenario: Malformed URL hashes do not break table of contents handling
- **GIVEN** a documentation URL has a malformed percent-encoded hash fragment
- **WHEN** the table of contents reads the current hash on the client
- **THEN** the page does not throw a decoding error
- **AND** the raw hash remains available for anchor matching

### Requirement: Internal Link Handling
The system SHALL resolve documentation internal links against canonical document URLs and expose valid, unpublished, broken, external, and ignored link states.

#### Scenario: Canonical internal link resolves as valid
- **GIVEN** a markdown or MDX link points to a visible production document under `/docs`
- **WHEN** the link is resolved against the documentation link index
- **THEN** the system marks the link as valid
- **AND** preserves the target canonical URL

#### Scenario: Link to non-production-visible document resolves as unpublished
- **GIVEN** a markdown or MDX link points to a known document that is not visible in production
- **WHEN** the link is resolved against the documentation link index
- **THEN** the system marks the link as unpublished

#### Scenario: Link to unknown internal document resolves as broken
- **GIVEN** a markdown or MDX link points under `/docs` to no known canonical document
- **WHEN** the link is resolved against the documentation link index
- **THEN** the system marks the link as broken

#### Scenario: External and anchor-only links are not validated as document targets
- **GIVEN** a link is external, empty, or anchor-only
- **WHEN** the link is normalized for documentation validation
- **THEN** the system does not treat it as an internal document target

#### Scenario: Markdown and MDX links are extracted outside fenced code
- **GIVEN** a document source contains inline markdown links, reference link definitions, and MDX href attributes
- **WHEN** link validation extracts links
- **THEN** the system extracts internal documentation targets with source path and line number
- **AND** ignores links inside backtick or tilde fenced code blocks

#### Scenario: Broken links fail quality gates outside local development
- **GIVEN** the documentation registry contains broken internal links
- **WHEN** the environment requires broken link assertions
- **THEN** the system MUST throw an error listing the broken source path, line, and href

#### Scenario: Broken links fail local MDX rendering
- **GIVEN** a rendered MDX link resolves as broken
- **WHEN** the documentation environment is local
- **THEN** the system logs the broken link
- **AND** throws a documents-system broken link error

#### Scenario: Broken or unpublished links are disabled in production rendering
- **GIVEN** a rendered MDX link or document link card resolves as broken or unpublished
- **WHEN** the documentation environment is production
- **THEN** the system renders a disabled non-navigation element
- **AND** labels the link state for the visitor

#### Scenario: Unpublished links remain clickable locally
- **GIVEN** a rendered MDX link or document link card resolves as unpublished
- **WHEN** the documentation environment is local
- **THEN** the system renders the link as clickable
- **AND** marks the link state as unpublished

### Requirement: Search Index
The system SHALL build a locale-aware search index from visible documents and their H2/H3 headings.

#### Scenario: Page results index visible document metadata
- **GIVEN** visible documents are loaded for a locale
- **WHEN** the search index is built
- **THEN** each page result includes title, description, href, group, parent item, order, searchable text, and normalized title text

#### Scenario: Heading results index source headings
- **GIVEN** visible documents have source content
- **WHEN** the search index is built
- **THEN** the system extracts H2 and H3 headings outside backtick or tilde fenced code blocks
- **AND** strips inline markdown formatting from heading titles
- **AND** creates stable heading hrefs using the page href plus heading anchor

#### Scenario: Search uses selected locale or fallback content
- **GIVEN** a registry for a requested locale selects locale-matching or fallback document variants
- **WHEN** the search index is built
- **THEN** the indexed page and heading text comes from the selected variant for each canonical document

#### Scenario: Empty search returns limited page suggestions
- **GIVEN** a search query is empty after normalization
- **WHEN** the index is searched
- **THEN** the system returns up to 32 page results in document order
- **AND** returns no heading results

#### Scenario: Typed search ranks pages and headings
- **GIVEN** a non-empty search query is submitted
- **WHEN** the index is searched
- **THEN** the system ranks exact title matches before title prefixes, title substrings, full-text matches, and fuzzy matches
- **AND** returns up to 8 page results
- **AND** returns up to 8 heading results

#### Scenario: Search normalizes text
- **GIVEN** source or query text contains mixed case, `ё`, punctuation, or repeated whitespace
- **WHEN** the system normalizes search text
- **THEN** it lowercases text
- **AND** normalizes `ё` to `е`
- **AND** keeps only letters, numbers, and spaces
- **AND** collapses repeated whitespace

#### Scenario: Search handles single-keyboard-layout input
- **GIVEN** a query is typed entirely with English-layout or Russian-layout letters
- **WHEN** the search query variants are built
- **THEN** the system also tries the converted opposite keyboard layout when the converted query is usable

#### Scenario: Fuzzy matching allows bounded typos
- **GIVEN** a query token has more than three characters
- **WHEN** the token does not directly match a candidate token
- **THEN** the system may match by Damerau-Levenshtein distance
- **AND** allows one edit for tokens of four to seven characters
- **AND** allows two edits for longer tokens

#### Scenario: Token fallback preserves exact short tokens
- **GIVEN** a multi-word query contains a token of three characters or fewer
- **AND** the exact query phrase is not contiguous in the indexed text
- **WHEN** the index is searched
- **THEN** exact token equality still matches that short token
- **AND** typo matching remains disabled for non-equal short tokens

### Requirement: Search API
The system SHALL expose documentation search through a public JSON route at `/api/v1/documents-system/search`.

#### Scenario: Search API returns JSON results
- **GIVEN** a visitor sends a GET request to `/api/v1/documents-system/search`
- **WHEN** the search succeeds
- **THEN** the system returns a JSON object with `pages` and `headings` arrays
- **AND** applies `Cache-Control: no-store`

#### Scenario: Query input is trimmed and limited
- **GIVEN** a search request includes a `q` parameter
- **WHEN** the search API reads the query
- **THEN** it trims surrounding whitespace
- **AND** limits the query to 120 characters before searching

#### Scenario: Locale parameter selects the search locale
- **GIVEN** a search request includes a `locale` parameter
- **WHEN** the search API reads the request
- **THEN** it resolves that value through the application locale resolver
- **AND** searches the documentation registry for that locale

#### Scenario: Missing locale uses default content locale
- **GIVEN** a search request has no `locale` parameter
- **WHEN** the search API reads the request
- **THEN** it searches using the default documentation content locale

#### Scenario: Search failure returns stable empty response
- **GIVEN** the search implementation throws an error
- **WHEN** the search API handles the request
- **THEN** it logs the failure under the documents-system scope
- **AND** returns HTTP 500 with empty `pages` and `headings` arrays
- **AND** applies `Cache-Control: no-store`

### Requirement: Search Dialog
The system SHALL provide a client-side search command that queries the search API and navigates to selected results.

#### Scenario: Search dialog opens from button or keyboard shortcut
- **GIVEN** the documentation header is visible
- **WHEN** the visitor clicks the search button or presses Ctrl+K or Command+K
- **THEN** the system opens the search dialog

#### Scenario: Search requests are debounced
- **GIVEN** the search dialog is open
- **WHEN** the visitor changes the query
- **THEN** the system waits for the debounce interval before requesting search results

#### Scenario: Search request includes active UI locale
- **GIVEN** the search dialog is open in a locale
- **WHEN** it requests results
- **THEN** the request includes the query and active UI locale

#### Scenario: Search results navigate on selection
- **GIVEN** the search dialog displays a page or heading result
- **WHEN** the visitor selects the result
- **THEN** the dialog closes
- **AND** the router navigates to the result href

#### Scenario: Search UI handles failed requests
- **GIVEN** a search request fails
- **WHEN** the search dialog receives the failure
- **THEN** it logs the error under the documents-system scope
- **AND** clears the displayed results
- **AND** displays the unavailable state

### Requirement: Metadata Images
The system SHALL generate share metadata and Open Graph images for documentation pages.

#### Scenario: Dynamic document metadata includes share image
- **GIVEN** a visible non-index documentation document exists
- **WHEN** route metadata is generated for the document page
- **THEN** the system sets title and description from document metadata
- **AND** sets Open Graph and Twitter image URLs to `/docs/og/:slug?locale=:locale`

#### Scenario: Static documentation home image uses feature metadata
- **GIVEN** the documentation home metadata image route is requested
- **WHEN** the Open Graph or Twitter image file handler runs
- **THEN** the system builds an image from the documentation home feature metadata

#### Scenario: Dynamic document image uses requested locale
- **GIVEN** a dynamic documentation image request includes a `locale` query parameter
- **WHEN** the image route handles the request
- **THEN** it resolves that locale
- **AND** finds the visible document for that locale
- **AND** builds an image from the document title and description

#### Scenario: Dynamic document image falls back to default locale
- **GIVEN** a dynamic documentation image request has no `locale` query parameter
- **WHEN** the image route handles the request
- **THEN** it uses the default documentation content locale

#### Scenario: Dynamic document image returns 404 for unknown document
- **GIVEN** no visible document exists for the requested image slug
- **WHEN** the image route handles the request
- **THEN** it returns HTTP 404 with a not-found body

### Requirement: Caching And Runtime Environment
The system SHALL cache documentation registries and derived indexes outside local development while keeping local development responsive to content edits.

#### Scenario: Local environment disables in-memory registry caching
- **GIVEN** the documentation environment is local
- **WHEN** a registry or search index is requested
- **THEN** the system rebuilds the data instead of returning process-level cached registry or index data

#### Scenario: Non-local environment uses process-level caches
- **GIVEN** the documentation environment is not local
- **WHEN** a registry, document list, link index, source map, or search index has already been loaded for a locale
- **THEN** the system may return the cached process-level value for that locale

#### Scenario: Cache Components expose hour-long cached helpers
- **GIVEN** a route calls a cached documentation helper
- **WHEN** the helper executes under Next.js Cache Components
- **THEN** it uses `use cache`
- **AND** applies an hourly cache life
- **AND** applies a documents-system cache tag for the cached data kind

#### Scenario: Documentation environment defaults to production in production and test
- **GIVEN** `DOCUMENTS_SYSTEM_ENV` is not set to `production`
- **WHEN** `NODE_ENV` is `production` or `test`
- **THEN** the documentation environment resolves as production

#### Scenario: Explicit production environment overrides local mode
- **GIVEN** `DOCUMENTS_SYSTEM_ENV` is `production`
- **WHEN** the documentation runtime resolves the environment
- **THEN** the documentation environment resolves as production

#### Scenario: Local development is the default outside production and test
- **GIVEN** `DOCUMENTS_SYSTEM_ENV` is not `production`
- **AND** `NODE_ENV` is neither `production` nor `test`
- **WHEN** the documentation runtime resolves the environment
- **THEN** the documentation environment resolves as local
