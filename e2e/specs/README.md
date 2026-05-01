# OpenSpec-backed E2E Tests

OpenSpec requirements are the source of intent for durable E2E scenarios.

Use this mapping:

- OpenSpec capability: `openspec/specs/<capability>/spec.md`
- E2E folder: `e2e/specs/<capability>/`
- Test file: one focused behavior area per `*.spec.ts`

Example:

```text
openspec/specs/workspace-onboarding-guard/spec.md
e2e/specs/workspace-onboarding-guard/zero-workspace-user.spec.ts
```

Write test titles so they name the requirement or scenario they cover. Keep smoke tests in
`e2e/smoke/`; this folder is for requirement-backed coverage.
