---
title: "27 апреля-4 мая 2026"
description: "Еженедельное обновление за 27 апреля-4 мая 2026."
group: "История изменений"
parentItem: "Еженедельные изменения"
order: 400
status: "published"
toc: true
author: "Template Maintainers"
version: "1.0.0"
editedAt: "2026-05-04"
---

# Еженедельное обновление - 27 апреля-4 мая 2026

## ✨ Новые возможности

- **Команды workspace**: placeholder Teams settings заменён на поддержку Better Auth Teams: создание, переименование, удаление команд, добавление и удаление участников, а также read-only режим для обычных участников.

- **Приглашения в команду**: приглашение теперь может быть привязано к конкретной команде workspace. Таблицы приглашений, pending cards и страницы решения показывают целевую команду, а accepted invitation добавляет пользователя в неё.

- **Распределённое кэширование**: добавлены опциональные Redis/Valkey cache handlers для Cache Components и ISR, общие настройки окружения и локальный fallback.

- **Local automation auth и Playwright E2E**: добавлен локальный сценарий входа для автоматизации, `/api/local-auth/scenario`, Playwright scripts, Chromium smoke coverage, warming маршрутов и проверка first-party ошибок.

## 🔧 Улучшения

- **Состояния загрузки workspace**: dashboard и workspace settings теперь используют локальные Suspense boundaries и skeletons вместо широкого full-route loading fallback.

- **Настроенные social providers**: login, account linking и navigation показывают только OAuth-провайдеры, для которых заданы обязательные переменные окружения.

- **Полировка навигации**: добавлены более насыщенная sidebar navigation, быстрый доступ к созданию workspace, secondary links, user menu и явное закрытие mobile sidebar.

- **Обратная связь в формах**: loading и validation UI переведены на общие button, field-message и form-error компоненты, чтобы формы меньше прыгали при отправке и ошибках.

## 🐛 Исправления

- **Проверки политик приглашений**: Better Auth organization hooks теперь применяют email-domain и team-target политики даже для raw plugin calls, обходящих feature actions.

- **Безопасность подключённых аккаунтов**: пользователь не может отвязать последний настроенный social provider, который ещё даёт доступ к аккаунту.

## 📝 Документация

- Добавлены release notes по teams, distributed caching и local automation. Обновлены E2E documentation, setup окружения, README, OpenSpec specs и agent guidance для browser automation workflows.
