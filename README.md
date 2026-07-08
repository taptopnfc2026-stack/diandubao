# Diandu English Reader

This repository contains the rebuilt frontend for the English textbook tapping product.

## What Is Included

- H5 preview: Vite app for browser validation.
- Admin preview: lightweight H5 dashboard for user, member, and payment preparation.
- Mini Program: native WeChat Mini Program MVP.
- Shared helpers: API request wrappers, audio item normalization, and coordinate-to-overlay conversion.

## H5 Preview

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev:h5
```

The H5 preview proxies `/api` to:

```text
https://diandu.xiongmaoxiazai.com
```

Build:

```bash
npm run build:h5
```

Admin preview:

```text
http://127.0.0.1:5173/admin.html
```

Test:

```bash
npm test
```

## Mini Program

Open this repository in WeChat DevTools. The mini program root is:

```text
miniprogram/
```

The current `project.config.json` uses `touristappid` for local preview. Replace it with the real mini program appid before release.

## MVP Scope

The MVP supports:

- Home
- Textbook selection
- Chapter directory
- Reader page with textbook images, tap regions, and audio playback
- Phonetic practice
- Alphabet pronunciation
- Natural phonics
- Basic admin dashboard with payment-ready data model

## Backend API

The frontend reuses existing endpoints:

- `/api/learn_eg/index`
- `/api/learn_eg/booklist`
- `/api/learn_eg/bookchaper`
- `/api/learn_eg/bookpage`
- `/api/learn_eg/updateuserbook`
- `/api/learn_eg/updatebookpage`
- `/api/learn_eg/getfayin`
- `/api/learn_eg/getfayinlist`
- `/api/learn_eg/getfayindetail`
- `/api/learn_eg/getpindu`

Reader pages use `bg_img` for the page image and `word_mp3[].coordinate` for tap regions.

## Admin Backend

Admin deployment assets live under:

```text
server/
```

- `server/sql/admin_mvp.sql`: tables for admin accounts, memberships, plans, orders, and study events.
- `server/thinkphp/application/api/controller/AdminDashboard.php`: ThinkPHP dashboard API draft.
- `server/API.md`: deployment notes and response contract.
