---
title: "Релизы"
description: "История опубликованных релизов Next.js шаблона и краткое описание пользовательски значимых изменений."
group: "История изменений"
groupOrder: 100
parentItem: "Релизы"
parentItemOrder: 10
order: 1000
status: "published"
toc: true
author: "Template Maintainers"
version: "1.1.0"
editedAt: "2026-07-06"
---

# Релизы

Этот раздел описывает опубликованные версии шаблона. В релизные заметки попадают изменения,
которые влияют на пользователей шаблона: новые экраны, сценарии авторизации, workspace-потоки,
API-доступ, локализация, безопасность и проверки качества.

## Актуальный релиз

- [v0.0.10](/docs/history/releases/0.0.10) — расширенное Playwright E2E-покрытие, надежность
  local automation auth, session-cache настройки для reused-server запусков и исправления
  workspace/API key потоков.

## Архив релизов

| Версия | Основная тема |
| ------ | ------------- |
| [v0.0.10](/docs/history/releases/0.0.10) | E2E-покрытие и надежность automation-сценариев. |
| [v0.0.9](/docs/history/releases/0.0.9) | Personal и organization API-ключи, `/api/v1`, scopes, expiration и rate limits. |
| [v0.0.8](/docs/history/releases/0.0.8) | Local automation auth, Playwright E2E и hooks для invitation policy. |
| [v0.0.7](/docs/history/releases/0.0.7) | Redis/Valkey-backed кеширование, streaming skeletons и показ только настроенных OAuth-провайдеров. |
| [v0.0.6](/docs/history/releases/0.0.6) | Better Auth Teams, team-targeted invitations и управление командами workspace. |
| [v0.0.5](/docs/history/releases/0.0.5) | Ограничения приглашений по email-доменам и предупреждения для участников вне политики. |
| [v0.0.4](/docs/history/releases/0.0.4) | Security hardening, безопасные redirects, приватность приглашений и защита session data. |
| [v0.0.3](/docs/history/releases/0.0.3) | Workspace на базе Better Auth Organizations, invitations, роли и settings surfaces. |
| [v0.0.2](/docs/history/releases/0.0.2) | Локализация через `next-intl`, переводы UI и локализованные metadata. |
| [v0.0.1](/docs/history/releases/0.0.1) | Первая публичная основа шаблона Next.js приложения. |

## Как читать историю

Используйте релизы, чтобы понять крупные опубликованные возможности. Более частые изменения
смотрите в [еженедельных заметках](/docs/history/change-logs). Если нужна детальная техническая
история, в репозитории также сохранены текстовые release notes в `docs/releases/template`.
