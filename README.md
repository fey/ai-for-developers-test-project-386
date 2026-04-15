# Calendar Slot App

Простое приложение для бронирования слотов (аналог cal.com): публичная запись на встречу и админка для управления типами событий.

## Деплой

Продакшн: [https://feycot-calendar-slot-code.onrender.com](https://feycot-calendar-slot-code.onrender.com)

## Требования

- ОС: Linux/macOS (для Windows рекомендуется WSL2).
- `node` 24.x (минимум 22.12+).
- `npm` 10+.
- `make` (GNU Make 4+).
- `docker` 24+ и Docker Compose v2+ (только для docker-сценариев).
- Свободные порты: `5173` (frontend) и `8080` (backend) для локального dev/e2e.

## Быстрый старт

```bash
cd code
make setup
make dev
```

Локально приложение доступно на `http://127.0.0.1:5173`.

## Основные команды (через Make)

```bash
make setup            # install dependencies
make build            # build backend + frontend
make dev              # run backend + frontend in dev mode
make start            # run built app (dist/dev.js)
make lint             # biome lint
make test             # vitest
make test-e2e         # playwright e2e
make test-e2e-headed  # playwright e2e in headed mode
make tsp-compile      # compile TypeSpec
make tsp-watch        # watch TypeSpec
make tsp-rebuild      # clean + compile TypeSpec
make demo-screenshots # generate demo screenshots
make demo-video       # generate demo video
make demo             # screenshots + video
```

## Docker-команды

```bash
make docker-build
make docker-start
make docker-push
```

По умолчанию используется образ `feycot/calendar-slot-code:latest`.

## Переменные окружения

- `PORT` — порт backend-сервера (по умолчанию `8080`).
- `BASE_URL` — базовый URL для demo/e2e сценариев при необходимости переопределения.
