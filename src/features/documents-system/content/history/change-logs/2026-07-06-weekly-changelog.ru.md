---
title: "29 июня-6 июля 2026"
description: "Еженедельное обновление за 29 июня-6 июля 2026."
group: "История изменений"
parentItem: "Еженедельные изменения"
order: 500
status: "published"
toc: true
author: "Template Maintainers"
version: "1.0.0"
editedAt: "2026-07-06"
---

# Еженедельное обновление - 29 июня-6 июля 2026

## ✨ Новые возможности

- **Личные и workspace API keys**: добавлены страницы управления API keys в `/user/api-keys` и `/w/:organizationKey/settings/api-keys` с созданием, редактированием, отключением, удалением, одноразовым показом секрета, сроком действия, rate limit и permission presets.

- **Scoped API v1 access**: добавлены стартовые `/api/v1` endpoints для metadata ключа, организаций, деталей организации, участников, команд и участников команды. API clients используют header `x-api-key`, а не browser session.

- **Публичная система документации**: добавлен `/docs` с общей оболочкой, sidebar navigation, breadcrumbs, поиском, MDX rendering, table of contents, metadata страниц, ссылками на заголовки, copy controls для кода и Open Graph images.

- **Локализованный контент документации**: файлы документации теперь могут использовать суффиксы локали, например `.en.md` и `.ru.md`; registry выбирает вариант под текущий язык UI и помечает fallback, если страница есть только на одной локали.

## 🔧 Улучшения

- **E2E coverage и надёжность автоматизации**: расширено OpenSpec-backed Playwright покрытие для account, workspace, invitations, teams, API keys, local automation, security и `/api/v1`. Общие helpers делают browser runs повторяемее.

- **Единая конфигурация API keys**: config ids для API keys и константа header `x-api-key` централизованы, при этом существующие imports остаются совместимыми.

- **Удобство authoring документации**: добавлены authoring examples, link cards, callouts, tabs, file-tree blocks, локализованные MDX UI labels, проверка битых ссылок, canonical URL checks и search indexing для страниц документации.

- **Полировка навигации документации**: добавлена ссылка на документацию в application navigation, удалён старый generic help shortcut, локализованы UI labels документации и выровнена типографика с остальным приложением.

## 🐛 Исправления

- **Регрессии локалей документации**: исправлены default-locale fallback, canonical slug generation, duplicate locale detection, link validation по локализованным файлам, отсутствующие сообщения `documentsSystem.pages.home` и локализованные labels времени чтения.

- **Консистентность automation sessions**: добавлена возможность отключать session-cookie cache для local automation и reused-server Playwright runs, чтобы тесты читали свежее состояние session.

- **Обновление workspace routes**: создание workspace и изменения settings теперь revalidate ключевые пути и переводят slug или route-key изменения на canonical settings route.

## 📝 Документация

- Добавлены release notes по API key management и E2E coverage, OpenSpec specs для API keys, API v1, local automation, account/session flows, workspace fallbacks и documentation system, а также публичные authoring pages в `/docs`.
