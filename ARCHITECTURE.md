## Overview

This project is a **Next.js 13 (App Router) React application** that provides a lightweight **admin panel** for the SmartiTV Android TV app. It has **no custom backend**; authentication and data live in **Firebase Auth + Firestore** via the v9 modular SDK in the browser.

The UI follows the Minbar TV admin look: **Tailwind CSS** with teal design tokens, a sidebar shell, and card grids. There is no Chakra UI.

At a high level:
- Client pages render forms, cards, and modals.
- Pages call small Firebase helper functions for Auth and Firestore.
- Videos are stored as **fields on category documents** (key = YouTube video ID, value = title), not as a subcollection.
- `AuthContext` wraps the app; the admin layout redirects unauthenticated users to `/signin`.

## Tech Stack

- **Framework**: Next.js 13.4 (App Router) with React 18.
- **UI**: Tailwind CSS, Radix Dialog, lucide-react icons, CSS variables (dark charcoal + teal accent `#0fa1a6`).
- **Forms**: `react-hook-form`.
- **BaaS**: Firebase v9 Auth (email/password) and Firestore.

## Application Structure

### Layout

- `src/app/layout.js` — root layout: Manrope font, `globals.css`, `AuthContextProvider`.
- `src/app/(admin)/layout.js` — client shell: `AdminLayout` (sidebar + header) and auth guard.
- `src/app/components/Sidebar.jsx`, `Header.jsx`, `AdminLayout.jsx` — navigation (Категории + Выйти).

### Routing

- `/signin` — email/password sign-in with a one-per-session intro video splash, then the form; redirects to `/categories`.
- Logo (`/logo.png`) on the sign-in page and in the admin sidebar.
- `/` — redirects to `/categories`.
- `/categories` — category cards; create category (with first video); delete empty categories; open videos.
- `/videos/[id]` — videos for one category (`id` = category document ID). Grid/list, search, create/edit/delete, YouTube playback modal.

### Context

- `src/app/context/auth-context.js` — `onAuthStateChanged`; exposes `{ user }`.

## Firebase Integration

Helpers under `src/app/firebase` return `{ result, error }`.

- Config: `NEXT_PUBLIC_FIREBASE_*` in `src/app/firebase/config.js`.
- Auth: `signin.js`, `signup.js` (no UI), `signout.js`.
- Firestore:
  - `get-all-data.js` — list `categories`.
  - `add-data.js` — create category document (`title` as ID, first video as a field).
  - `delete-data.js` — delete category document.
  - `get-all-sub-data.js` — list video **fields** of a category doc.
  - `add-sub-data.js` — add a video field.
  - `update-video-field.js` — rename/update video key + title.
  - `delete-video-field.js` — remove one video field.

## Data model

```text
categories / "{Category Title}"
  {
    "dQw4w9WgXcQ": "Video title"
  }
```

YouTube URLs are normalized to 11-character IDs via `src/app/utils/extractYoutubeVideoId.js`. Playback in admin uses `https://www.youtube.com/embed/{videoId}`.

## Auth flow

1. `AuthContextProvider` subscribes to `onAuthStateChanged`.
2. Admin layout redirects to `/signin` when `user` is null.
3. Sign-in calls `signInWithEmailAndPassword`, then `/categories`.
