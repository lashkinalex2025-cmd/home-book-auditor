# Домашний книжный аудитор

Современное PWA для учёта домашней библиотеки: книги, поиск, статистика, резервные копии и офлайн-режим.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)
![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8)
![License](https://img.shields.io/badge/license-MIT-green)

## Возможности

- **Моя библиотека** — карточки книг с обложками, статусами, рейтингом, тегами
- **Учёт полей** — название, автор, серия, том, жанр, ISBN, издательство, год, язык, страницы, дата покупки, цена, место хранения, заметки
- **Статусы** — хочу купить / куплена / читаю / прочитана / продана / подарена
- **Поиск и фильтры** — по названию, автору, ISBN, жанру, тегам, серии
- **Статистика** — Chart.js: жанры, авторы, стоимость, страницы, динамика
- **Экспорт / импорт** — JSON, CSV, Excel
- **Резервное копирование** и восстановление одним импортом
- **Обложки** — загрузка и камера, автосжатие
- **Сканер ISBN** — камера (barcode) + ручной ввод
- **PWA** — offline, install, splash, maskable icons
- **Темы** — светлая / тёмная / system
- **Drag & Drop** импорт, Web Share API
- **Capacitor** — готовность к сборке Android APK/AAB

## Скриншоты

> Место для скриншотов: добавьте изображения в `docs/screenshots/` и вставьте сюда.

| Главная | Библиотека | Статистика |
|---------|------------|------------|
| _screenshot_ | _screenshot_ | _screenshot_ |

## Быстрый старт

```bash
cd lib
npm install
npm run icons    # генерация PWA-иконок
npm run dev      # http://localhost:5173
```

### Сборка

```bash
npm run build
npm run preview
```

### Тесты и качество

```bash
npm test
npm run lint
npm run format
```

## Архитектура

```
src/
  components/   # UI, layout, book widgets
  context/      # Settings (theme, locale, card size)
  db/           # Dexie / IndexedDB
  hooks/        # useBooks, live queries
  lib/          # validation, export/import, stats, image, push
  pages/        # route screens (lazy-loaded)
  types/        # Book, settings, statuses
```

- **UI:** React 19 + TypeScript + Tailwind + Framer Motion + Heroicons  
- **Forms:** React Hook Form + Zod  
- **Storage:** IndexedDB via Dexie (local-only, no backend)  
- **Routing:** React Router (HashRouter — совместимо с GitHub Pages)  
- **PWA:** vite-plugin-pwa (Workbox, autoUpdate)  
- **Charts:** Chart.js  
- **Lists:** @tanstack/react-virtual для больших коллекций  
- **Mobile:** Capacitor 7  

### Безопасность

- Валидация ввода (Zod)
- Санитизация импорта (отсечение бинарного мусора, лимиты длины)
- Обложки только `data:image/*`
- Локальное хранение — данные не уходят на сервер

### Производительность

- Lazy routes + manual chunks (vendor, charts, xlsx, motion)
- Сжатие обложек (max 800px JPEG)
- Виртуализация длинных списков
- Offline cache assets

## Публикация на GitHub Pages

1. Создайте репозиторий и запушьте код.
2. Settings → Pages → Source: **GitHub Actions**.
3. Workflow `.github/workflows/ci.yml` собирает проект и деплоит `dist/` при push в `main`/`master`.
4. В `vite.config.ts` уже `base: './'` и HashRouter — пути работают на Pages.

Локально:

```bash
npm run build
# содержимое dist/ можно раздать любым static host
```

## Android (Capacitor)

Требования: JDK 21, Android Studio, Android SDK.

```bash
npm install
npm run build
npx cap add android      # один раз — создаёт android/
npx cap sync
npx cap open android
```

В Android Studio: **Build → Build Bundle(s) / APK(s)**.

Уже настроено:

- `capacitor.config.ts` — appId `ru.homebookauditor.app`
- Splash / StatusBar / Keyboard plugins
- `webDir: dist`
- Adaptive-friendly theme color `#0f766e`

После первого `cap add android` папка `android/` готова к открытию в Android Studio.

### Разрешения

Камера используется через Web API / file input (`capture`) для обложек и ISBN. При необходимости добавьте `CAMERA` в `AndroidManifest.xml` после генерации native-проекта.

## Push Notifications

Архитектура подготовлена в `src/lib/push.ts` (проверка поддержки, запрос permission, точка регистрации subscription). Для production подключите VAPID-ключ и backend.

## Структура репозитория

| Файл | Назначение |
|------|------------|
| `package.json` | зависимости и скрипты |
| `vite.config.ts` | Vite + PWA + chunks |
| `capacitor.config.ts` | Android shell |
| `eslint.config.js` / `prettier.config.js` | качество кода |
| `.github/workflows/ci.yml` | lint, test, build, Pages |
| `LICENSE` | MIT |
| `CHANGELOG.md` | история версий |
| `CONTRIBUTING.md` | вклад в проект |

## Лицензия

MIT — см. [LICENSE](./LICENSE).
