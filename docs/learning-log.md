# Engineering Log & Architecture

## 1. Этапы разработки (Milestones Roadmap)
- [x] **Milestone 0: Каркас API** — TypeScript, Express, dev-окружение (tsx), проверка здоровья (/health).
- [x] **Milestone 1: Локальная БД и CRUD бизнесов** — Docker Compose, PostgreSQL 17, Prisma 7, Zod, Biome, Vitest.
- [x] **Milestone 2: Аудит сайтов и SSRF-защита**
  - [x] 2.1: Модель `WebsiteAudit` в Prisma + миграция (`20260912131806_add_website_audit`)
  - [x] 2.2: Сервис `audit.service.ts` (проверка доступности, замер response time, статусы)
  - [x] 2.3: Защита от SSRF (`safeUrl.ts` на базе `ipaddr.js` + DNS pre-resolve + ручные редиректы до 5 хопов)
  - [x] 2.4: Эндпоинты `POST /businesses/:id/audits` и `GET /businesses/:id/audits`
  - [x] 2.5: Архитектурное решение ADR-0006 и покрытие Unit-тестами (35 тестов)
  - [x] 2.6: Усиление после ревью — общий deadline аудита, HTTP(S)-валидация на границе API, regression-тесты обфусцированных loopback-адресов и индекс истории аудитов

## 2. Стек технологий и обоснование выбора
| Инструмент | Версия | Зачем нужен (решаемая проблема) |
| :--- | :--- | :--- |
| **Node.js** | 22 LTS | Стабильная среда выполнения с долгим сроком поддержки. |
| **TypeScript** | 7.0.2 | Статическая типизация, строгий режим (`strict: true`), защита от опечаток. |
| **Express** | 5.2.1 | Минималистичный стандарт индустрии для создания REST API. |
| **PostgreSQL** | 17 (Docker) | Надежная реляционная СУБД в изолированном локальном контейнере. |
| **Prisma ORM** | 7.10.0 (Stable) | Безопасная работа с БД без ручного SQL, автогенерация типов под схему. |
| **@prisma/adapter-pg + pg** | 7.10.0 / 8.16.3 | Официальный стабильный драйвер и пул TCP-соединений для Prisma 7. |
| **Zod** | 4.6.1 | Валидация внешних данных на границе API во время выполнения (runtime). |
| **Biome** | 2.5.13 (Stable) | Единый быстрый Rust-линтер и форматтер (замена ESLint + Prettier). |
| **Vitest** | 5.0.0 (Stable) | Быстрый тестовый фреймворк для unit и интеграционных тестов с ESM. |
| **ipaddr.js** | 2.5.0 (Stable) | Парсинг и определение приватных/публичных диапазонов IPv4/IPv6 для SSRF-защиты. |

## 3. Архитектурный поток данных (Data Flow)
`Запрос (HTTP JSON)` 
  ➔ `Express (Маршрутизация)` 
  ➔ `Zod (Валидация: 400 Bad Request при ошибке)` 
  ➔ `Prisma Client (Типобезопасный запрос)` 
  ➔ `pg Pool (TCP-сокет)` 
  ➔ `PostgreSQL` 
  ➔ `Ответ клиенту (200 / 201 / 204)`

Поток website audit:

`POST /businesses/:id/audits`
  ➔ `Prisma: найти Business`
  ➔ `validateSafeUrl: синтаксис, протокол, DNS и публичные IP`
  ➔ `fetch: ручные редиректы, timeout на hop и общий deadline`
  ➔ `Prisma: сохранить WebsiteAudit`
  ➔ `201 Created`

## 4. Ключевые решения и грабли (Lessons Learned)
* **Стабильность версий**: Никогда не использовать npm `latest` вслепую, если он указывает на RC/бета-версии (кейс Prisma 8-rc). Всегда явно проверять и фиксировать стабильные релизы.
* **Prisma 7 Driver Adapters**: В Prisma 7 упразднен бинарный движок на Rust; для прямого подключения к PostgreSQL обязательна связка `@prisma/adapter-pg` + драйвер `pg` с пулом соединений.
* **SSRF**: URL от пользователя нельзя передавать в `fetch` без проверки протокола, DNS-результатов и каждого redirect target. Loopback, private, link-local и metadata-адреса должны блокироваться.
* **Ограниченный внешний I/O**: Timeout отдельного HTTP-запроса не ограничивает всю операцию с DNS и цепочкой редиректов; для предсказуемого времени нужен общий deadline.
* **Git mental model**: `HEAD` указывает на текущую ветку, ветка — на commit. `git status` сравнивает `HEAD`, staging area и working tree; в commit попадает только staging area.
