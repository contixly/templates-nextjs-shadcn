---
name: "OpenSpec: Retrofit"
description: "Reverse-engineer OpenSpec specs from existing codebase with interactive confirmation."
category: OpenSpec
tags: [openspec, retrofit, discovery]
---
<!-- OPENSPEC:START -->
**Guardrails**
- Generate all specs in-memory first; write files only after explicit user confirmation.
- Retrofit produces a **starting point**, not final truth. Users will refine specs afterward.
- Follow OpenSpec format strictly (Requirements with SHALL/MUST + Scenarios with GIVEN/WHEN/THEN).
- Refer to `openspec/AGENTS.md` for OpenSpec conventions and spec format rules.
- Ask clarifying questions when capability boundaries are unclear.

**Workflow**

Track these phases as TODOs. Use parallel exploration where steps are independent.

---

### Phase 1: Discovery (Parallel Exploration)

Launch these tasks in parallel using the Task tool with `subagent_type=Explore`:

1. **Detect Tech Stack** - Check for marker files:
   - `package.json` → Node/JavaScript ecosystem
     - Check `dependencies` for: react, next, vue, angular, express, fastify
     - Check `devDependencies` for: typescript, tailwindcss, playwright, jest
   - `requirements.txt` or `pyproject.toml` → Python ecosystem
     - Look for: fastapi, django, flask, sqlalchemy, pydantic
   - `go.mod` → Go ecosystem
   - `Cargo.toml` → Rust ecosystem
   - `Gemfile` → Ruby ecosystem
   - `composer.json` → PHP ecosystem
   - `docker-compose.yml` → Container orchestration

2. **Identify Architecture Patterns** - Analyze directory structure:
   - Backend: Look for `routers/`, `services/`, `repositories/`, `models/`, `handlers/`
   - Frontend: Look for `app/`, `pages/`, `features/`, `components/`, `hooks/`
   - Shared: Look for `lib/`, `utils/`, `common/`, `shared/`
   - Document layer separation (e.g., "Clean Architecture: routers → services → repositories")

3. **Discover Dev Commands** - Extract from configuration files:
   - `package.json` scripts section
   - `Makefile` targets
   - `pyproject.toml` scripts
   - Document: dev server command, test command, lint command, build command

4. **Find Existing Conventions** - Look for documentation:
   - `README.md` - Project overview and setup
   - `CONTRIBUTING.md` - Contribution guidelines
   - `.editorconfig` - Code style settings
   - ESLint/Prettier/Black/Ruff configs - Formatting rules

5. **Detect Constraints** - Identify from code patterns:
   - API rate limiting (retry logic, rate limit headers)
   - Caching patterns (Redis, in-memory)
   - Authentication methods (JWT, OAuth, API keys)
   - Read-only vs read-write integrations

Compile findings into an in-memory **Discovery Report**.

---

### Phase 2: Capability Identification

Analyze routes, services, and features to identify logical capabilities.

1. **User-Facing Features** - Parse routes/pages:
   - Backend: Parse router files for API endpoints
     - FastAPI: `@router.get`, `@router.post`, etc.
     - Express: `app.get`, `router.post`, etc.
     - Django: `urlpatterns`, `@api_view`
   - Frontend: Parse page/route files
     - Next.js App Router: `app/**/page.tsx`
     - Next.js Pages: `pages/**/*.tsx`
     - React Router: route definitions
   - Group related endpoints into features (e.g., `/compliance/*` → "compliance")

2. **Internal Capabilities** - Analyze services/modules:
   - Service layer: What business logic exists?
   - Integration layer: What external APIs are consumed?
   - Repository layer: What data models are managed?
   - Background tasks: What async operations exist?

3. **Group into Capability Boundaries** - Apply naming conventions:
   - Use kebab-case verb-noun format: `user-auth`, `jira-integration`, `compliance-reporting`
   - Single purpose per capability (split if description needs "AND")
   - Common patterns:
     - `portal-core` - Shell, routing, shared UI, infrastructure
     - `<integration>-integration` - External API integrations
     - `<feature>-<domain>` - Feature-specific capabilities

4. **Rate Confidence** - For each capability:
   - **High**: Clear boundaries, distinct purpose, well-isolated code
   - **Medium**: Some overlap, purpose inferred from code
   - **Low**: Mixed concerns, unclear boundaries, may need splitting/merging

For each capability, note: name, purpose, key files, dependencies, confidence level.

---

### Phase 3: Spec Generation (In-Memory)

Generate specs following OpenSpec format. Do NOT write files yet.

1. **Generate project.md** - Create project context document:
   ```markdown
   # Project Context

   ## Purpose
   [Extracted from README or inferred from codebase]

   ## Tech Stack
   ### Frontend
   - [Detected frontend technologies]

   ### Backend
   - [Detected backend technologies]

   ### Infrastructure
   - [Detected infrastructure components]

   ## Project Conventions
   ### Code Style
   [Extracted from linter configs, .editorconfig]

   ### Architecture Patterns
   [Detected from directory structure]

   ### Testing Strategy
   [Inferred from test files and configs]

   ### Git Workflow
   [If detected from .github, commit patterns]

   ## Important Constraints
   [Rate limits, read-only, security requirements, etc.]
   ```

2. **Generate capability specs** - For each identified capability:
   ```markdown
   # <capability-name> Specification

   ## Purpose
   [1-2 sentence description]

   ## Requirements

   ### Requirement: <Feature Name>
   The system SHALL [behavior using normative language].

   #### Scenario: <Happy path>
   - **GIVEN** [precondition]
   - **WHEN** [action]
   - **THEN** [expected outcome]

   #### Scenario: <Error case>
   - **GIVEN** [error condition]
   - **WHEN** [action attempted]
   - **THEN** [error handling behavior]
   ```

3. **Requirement extraction heuristics**:
   - API endpoint → Requirement for that operation
   - Service method → Requirement for business logic
   - Error handling → Error scenario
   - Validation logic → Validation requirement
   - Configuration options → Configuration requirement

4. **Scenario extraction heuristics**:
   - Happy path: What the code does when everything works
   - Error path: What happens on failure (try/catch, error responses)
   - Edge cases: Conditional logic, null checks, boundary conditions

5. **Validate generated content** (in memory):
   - Every requirement has at least one `#### Scenario:`
   - Scenarios use GIVEN/WHEN/THEN bullet format
   - Requirements use SHALL/MUST normative language
   - Capability names are unique and follow conventions

Store all generated content in memory.

---

### Phase 4: Summary & Confirmation

Present findings and obtain user approval before writing.

1. **Present Discovery Summary**:
   ```
   === RETROFIT SUMMARY ===

   Tech Stack Detected:
   - Frontend: [e.g., Next.js 15, React 19, TypeScript, Tailwind CSS]
   - Backend: [e.g., Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL]
   - Infrastructure: [e.g., Docker Compose, Redis]

   Architecture Pattern: [e.g., Clean Architecture]

   Dev Commands:
   - Start: [command]
   - Test: [command]
   - Lint: [command]
   ```

2. **Present Capability Summary**:
   ```
   Capabilities Identified: [N]

   1. [capability-name] (confidence: high)
      Purpose: [brief description]
      Requirements: [N] | Scenarios: [N]
      Key files: [2-3 key files]

   2. [capability-name] (confidence: medium)
      ...
   ```

3. **Interactive Confirmation** - Use AskUserQuestion for decisions:

   a. **Check for existing openspec/**:
      - If exists, present options:
        - **Overwrite**: Replace all (backs up existing to `openspec/.backup/`)
        - **Merge**: Add new capabilities, preserve existing
        - **Supplement**: Only add `project.md` if missing
        - **Abort**: Cancel retrofit

   b. **project.md confirmation**:
      - Show preview
      - Ask: "Write project.md? (y/n/edit)"

   c. **Per-capability confirmation**:
      - For each capability, ask:
        - **y**: Include as-is
        - **n**: Skip this capability
        - **r**: Rename (provide new name)
        - **m**: Merge with another capability
        - **s**: Split into multiple capabilities
        - **p**: Preview full spec first

   d. **Low confidence capabilities**:
      - Flag with "(confidence: low)" and explain:
        - "Could be part of [other-capability]"
        - "Mixed concerns detected"
      - Ask explicitly whether to keep, merge, or skip

4. **Build Final Write Plan**:
   - List all files to be created
   - List all files to be skipped
   - Confirm: "Proceed with writing [N] files? (y/n)"

---

### Phase 5: Write Files

Only proceed after explicit user confirmation from Phase 4.

1. **Create directory structure** (if missing):
   ```
   openspec/
   ├── project.md
   └── specs/
       ├── [capability-1]/
       │   └── spec.md
       └── [capability-2]/
           └── spec.md
   ```

2. **Handle existing openspec/**:
   - If user chose **merge**: Add new capabilities only, skip existing
   - If user chose **overwrite**: Back up to `openspec/.backup/<timestamp>/` first
   - If user chose **supplement**: Only write `project.md`

3. **Write files in order**:
   a. Create `openspec/` directory if needed
   b. Write `openspec/project.md`
   c. For each confirmed capability:
      - Create `openspec/specs/<capability>/` directory
      - Write `openspec/specs/<capability>/spec.md`

4. **Post-write validation**:
   - Run `openspec validate --strict`
   - If validation fails, report issues but keep files
   - Suggest fixes for common format issues

5. **Report completion**:
   ```
   === RETROFIT COMPLETE ===

   Files created:
   - openspec/project.md
   - openspec/specs/[capability-1]/spec.md
   - openspec/specs/[capability-2]/spec.md

   Validation: [PASSED/FAILED with N issues]

   Next steps:
   1. Review generated specs and refine requirements
   2. Run `openspec list --specs` to verify
   3. Use `openspec validate --strict` to check format

   NOTE: These specs are a starting point. Refine them
   to reflect intended behavior, not implementation quirks.
   ```

---

### Edge Cases

**Monorepo Detection**:
If multiple package.json/requirements.txt found:
- Ask: "Detected monorepo with [N] packages. Options:
  - a: Analyze all packages together
  - s: Select specific packages
  - r: Analyze root only"
- For multi-package: prefix capability names (e.g., `api-auth`, `web-dashboard`)

**Partial Existing Specs**:
If some specs exist but are incomplete:
- Detect: Missing Purpose, requirements without scenarios, empty files
- Offer: Enhance (add to existing), Replace, or Skip

---

**Reference**
- `openspec list --specs` - Verify created specs
- `openspec validate --strict` - Validate format compliance
- `openspec/AGENTS.md` - OpenSpec conventions reference
- Task tool with `subagent_type=Explore` - Parallel codebase exploration
- Context7 MCP for framework-specific patterns:
  ```
  mcp__plugin_context7_context7__resolve-library-id
  mcp__plugin_context7_context7__query-docs
  ```
<!-- OPENSPEC:END -->
