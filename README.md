# Diandu English Reader

This repository contains the rebuilt frontend for the English textbook tapping product.

## What Is Included

- H5 preview: Vite app for browser validation.
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

The MVP does not include:

- Membership
- Invitation rewards
- Paid course recommendations
- Full phonetic, alphabet, and natural phonics modules

## Backend API

The frontend reuses existing endpoints:

- `/api/learn_eg/index`
- `/api/learn_eg/booklist`
- `/api/learn_eg/bookchaper`
- `/api/learn_eg/bookpage`
- `/api/learn_eg/updateuserbook`
- `/api/learn_eg/updatebookpage`

Reader pages use `bg_img` for the page image and `word_mp3[].coordinate` for tap regions.
