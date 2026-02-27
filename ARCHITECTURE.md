## Overview

This project is a **Next.js 13 (App Router) React application** that provides a lightweight **admin-style panel on top of Firebase**. It has **no custom backend server**; all authentication and data persistence are handled directly in the browser using the **Firebase v9 modular SDK** (Auth + Firestore). The UI is built primarily with **Chakra UI** components, while **Tailwind CSS** is configured but used sparingly.

At a high level:
- The **browser UI** (React client components) renders forms, tables, and modals for managing data.
- These components call small **Firebase helper “services”** to perform Auth and Firestore operations.
- Firebase connects to your project using **environment-driven configuration** and persists data in **collections and subcollections** (e.g. `categories` and their `videos`).
- **Global auth state** is managed via a React context that wraps the app, and routes are guarded by redirecting unauthenticated users to the sign-in page.

## Tech Stack

- **Framework**: Next.js 13.4 (App Router) with React 18.
- **UI**: Chakra UI (`@chakra-ui/react`, `@chakra-ui/next-js`), with Tailwind CSS configured.
- **State & Forms**:
  - React hooks (`useState`, `useEffect`) for local state.
  - `react-hook-form` for form state and validation.
- **Backend-as-a-Service**: Firebase v9
  - Auth (`firebase/auth`) for email/password sign-in.
  - Firestore (`firebase/firestore`) for document storage.
- **Styling/Tooling**: Tailwind CSS, PostCSS, Emotion (via Chakra), Next tooling (ESLint, dev/build scripts).

## Application Structure

### High-level layout

- `src/app/layout.js`
  - Declares the root layout for the App Router.
  - Wraps all pages with:
    - `AuthContextProvider` (global auth state).
    - Chakra UI `Providers` (theme and style cache).
  - Exposes basic `metadata` for the application.

- `src/app/providers.jsx`
  - Configures Chakra UI:
    - `CacheProvider` (for correct style insertion with Next).
    - `ChakraProvider` (theme provider).
  - Any future global UI providers (e.g. custom theme) should be added here.

### Routing

Routing uses **Next.js App Router** conventions under `src/app`:

- `src/app/page.js`
  - The **home/dashboard page**.
  - Lists all **categories** from Firestore.
  - Allows creating and deleting categories.
  - Links into the videos page for each category.

- `src/app/signin/page.js`
  - The **sign-in page** for email/password authentication.
  - Uses Chakra UI form components and `react-hook-form`.
  - On successful sign-in, redirects to `/`.

- `src/app/videos/[id]/page.js`
  - A **dynamic route** for managing videos belonging to a category.
  - Parameter `id` is the category document ID.
  - Fetches and displays the videos subcollection under `categories/:id`.
  - Allows creation and updating of video entries.

### Context and State Management

- `src/app/context/auth-context.js`
  - Defines `AuthContext` and `AuthContextProvider`.
  - Subscribes to Firebase Auth state via `onAuthStateChanged`.
  - Exposes:
    - `user`: the current authenticated Firebase user (or `null`).
    - `loading`: a flag indicating whether the initial auth check is in progress.
  - Renders a simple `Loading...` while the initial auth state is resolving.
  - Consumed via `useAuthContext()` hook in pages to:
    - Redirect unauthenticated users to `/signin`.
    - Access the current user where needed.

- Page-level components
  - Use `useState` and `useEffect` for local UI state (lists, selections, dialogs, etc.).
  - Use `react-hook-form` for form values and validation.
  - Use Chakra `useToast` for user-facing feedback and error messages.

## Firebase Integration

All Firebase-related logic lives under `src/app/firebase` and is split into **config**, **auth helpers**, and **Firestore helpers**.

### Configuration

- `src/app/firebase/config.js`
  - Initializes the Firebase app via `initializeApp`.
  - Reads configuration from `NEXT_PUBLIC_FIREBASE_*` environment variables.
  - Exports a singleton `firebase_app` instance used by all helpers.

### Auth helpers

- `src/app/firebase/auth/signin.js`
  - Wraps `signInWithEmailAndPassword(firebase_auth, email, password)`.
  - Returns a normalized `{ result, error }` object for easier consumption.

- `src/app/firebase/auth/signup.js`
  - Wraps `createUserWithEmailAndPassword` for registration, if exposed in the UI.

- `src/app/firebase/auth/signout.js` (by convention)
  - Wraps `signOut` to log out the current user.

These helpers are called from client components (e.g. `signin/page.js`) and integrate with `AuthContext`’s listener for auth state changes.

### Firestore helpers

Located under `src/app/firebase/firestore` and implemented as small, focused service functions returning `{ result, error }`:

- `get-all-data.js`
  - Reads all documents from a top-level collection (e.g. `categories`).

- `get-all-sub-data.js`
  - Reads all documents from a **subcollection** under a specific parent document (e.g. videos under a category).

- `get-data.js`
  - Reads a **single document** from a collection by ID.

- `add-data.js`
  - Adds a new document to a top-level collection (e.g. creating a category).

- `add-sub-data.js`
  - Adds or updates a document within a subcollection (e.g. creating/updating a video for a category).

- `delete-data.js`
  - Deletes a document from a collection by ID.

Pages call these helpers rather than using the Firebase SDK directly, which:
- Keeps Firestore interaction centralized.
- Standardizes error handling and return shapes.
- Makes it easier to adapt or migrate data access logic later.

## Data Flow

### Authentication flow

1. The app boots and `AuthContextProvider` subscribes to Firebase Auth via `onAuthStateChanged`.
2. While the first auth state is loading, the provider shows `Loading...`.
3. Once resolved, `user` is either a Firebase user or `null`.
4. Protected pages (e.g. `/`, `/videos/[id]`) check `user`:
   - If `user` is `null`, they redirect to `/signin`.
   - If `user` exists, the page content renders and can perform Firestore operations.
5. The sign-in page uses `signin` helper to log in and then redirects to `/`, where the auth context now has a user.

### Categories and videos

1. The home page (`page.js`) calls `get-all-data('categories')` to load the list of categories from Firestore.
2. Creating a category calls `add-data('categories', payload)`, then re-fetches or updates local state.
3. Deleting a category calls `delete-data('categories', id)` and updates the UI list.
4. Navigating to `/videos/[id]` passes the category ID as a route param.
5. The videos page calls:
   - `get-data('categories', id)` to fetch the parent category if needed.
   - `get-all-sub-data('categories', id, 'videos')` (or equivalent) to load the videos subcollection.
6. Creating or updating a video calls `add-sub-data` with the category ID and the video fields, then refreshes the list.

Throughout, pages use Chakra UI components for layout and feedback, and toasts to indicate success or error conditions.

## Configuration & Environment

- **Environment variables** (e.g. `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.) must be set for Firebase to initialize correctly.
- **Next.js config** (`next.config.js`) is minimal; the App Router under `src/app` is the effective entry point.
- **Tailwind** and **PostCSS** are wired via `tailwind.config.js` and `postcss.config.js`, though Chakra is the primary styling system.

## Notable Conventions and Extension Points

- **Service-style Firebase helpers**:
  - All Firebase operations are wrapped in small, domain-specific functions.
  - To add new data features (e.g. another collection), follow the same pattern under `src/app/firebase`.

- **Auth via context**:
  - Auth is centralized in `AuthContext`. To introduce roles/permissions, extend this context to include role/claim information and update guarded pages accordingly.

- **UI composition via Chakra**:
  - New pages should follow the existing pattern: Chakra layout primitives, forms, and `useToast` for feedback.

This document should give you enough context to navigate the codebase, understand how data and auth flow through the app, and extend it while staying consistent with the existing architecture.

