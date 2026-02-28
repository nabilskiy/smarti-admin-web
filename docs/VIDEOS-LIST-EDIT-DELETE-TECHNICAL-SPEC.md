# Videos List Page — Edit & Delete: Technical Specification

**Document purpose:** Analyze the current implementation of the Videos List page, verify Edit and Delete logic, and specify the production-ready implementation.

**Scope:** `src/app/videos/[id]/page.js` (Videos List page), related Firestore helpers, and ID/data flow.

---

## 1. Current State

### 1.1 Component and Location

| Item | Detail |
|------|--------|
| **Component** | Default export of `src/app/videos/[id]/page.js` — function `Videos({ params })` |
| **Route** | Dynamic: `/videos/[id]` where `[id]` is the category document ID (e.g. category title: "Test Category" → URL `/videos/Test%20Category`) |
| **Client-side** | `'use client'`; uses Chakra UI, react-hook-form, Firebase helpers |

### 1.2 Where Edit and Delete Are Rendered

- **Location:** Inside the table body, one row per video (lines ~255–268).
- **Edit button:** Rendered with `onClick={() => updateVideoHandler(video.id)}`. Passes `video.id` (the document field key, e.g. YouTube ID or link).
- **Delete button:** Rendered with no `onClick`. **Not wired to any handler.**

```jsx
<Button colorScheme='yellow' size='sm' onClick={() => updateVideoHandler(video.id)}>Edit</Button>
<Button colorScheme='red' size='sm'>Delete</Button>  // no onClick
```

### 1.3 Functions Triggered on Click

| Button | Handler | Behavior |
|--------|---------|----------|
| **Edit** | `updateVideoHandler(id)` | Sets modal to "update" mode, finds video by `id` in `videos` array, sets form values (`title`, `videoId`) with `setValue`, opens modal. On submit, `onSubmit` calls `addSubData(..., categoryId, selectedVideo.id, values.title, values.videoId)`. |
| **Delete** | *(none)* | No function is triggered. |

### 1.4 How `videoId` and `categoryId` Are Passed

**Data model (Firestore):**

- Categories are **top-level documents** in collection `categories`. Document ID = category title (e.g. `"Test Category"`).
- **Videos are not a subcollection.** They are **fields on the category document**: `{ [videoKey1]: title1, [videoKey2]: title2 }`. Each key is the "video id" (e.g. YouTube ID or link), value is the display title.

**ID flow:**

| ID | Source | Passed to | Decode/encode |
|----|--------|-----------|----------------|
| **categoryId** | `params?.id` from Next.js dynamic segment (e.g. `"Test Category"`) | `fetchVideos` → `getSubDouments('categories', categoryId)`; `onSubmit` → `addSubData('categories', categoryId, ...)` | Next.js decodes route params. `get-all-sub-data.js` uses `decodeURIComponent(id)` before `getDoc`. `add-sub-data.js` does **not** decode `categoryId` (relies on Next.js). |
| **videoId** | From list: `video.id` (key from Firestore doc). From form: `values.videoId` (user input). | Edit: `updateVideoHandler(video.id)`; Submit: `addSubData(..., categoryId, selectedVideo?.id, values.title, values.videoId)` | No URL encoding for in-memory ids. If video keys ever come from URL, decoding should be applied where they are read. |

**Navigation to Videos page:** Categories page uses `router.push(\`videos/${category.id}\`)`. No explicit `encodeURIComponent`; browser/Next may encode the path (e.g. space → `%20`).

### 1.5 Firestore Integration

| Operation | Helper | Firestore API used | Used by Videos page? |
|-----------|--------|--------------------|----------------------|
| List "videos" (fields of category doc) | `getSubDouments` in `get-all-sub-data.js` | `getDoc(doc(db, collectionName, decodedId))`, then `Object.keys(data)` | Yes — `fetchVideos()` |
| Create video (add field) | `addSubData` in `add-sub-data.js` | `setDoc(..., { merge: true })` | Yes — `onSubmit` when `selectedVideo` is null |
| Update video (update field) | Same `addSubData` | `updateDoc(docRef, { [videoId]: _titleVideo })` | Yes — `onSubmit` when `selectedVideo` is set |
| Delete category (whole doc) | `deleteDocument` in `delete-data.js` | `deleteDoc(doc(db, collectionName, id))` | No (used on Categories page). **Not suitable for deleting a single video field.** |

There is **no Firestore helper** that removes a single field from a document (required for "delete video"). Deleting a video requires `updateDoc(ref, { [videoId]: deleteField() })` (Firestore `deleteField()`).

---

## 2. Verification Summary

### 2.1 IDs and decodeURIComponent

| Check | Status | Notes |
|------|--------|-------|
| **categoryId from URL** | OK | `get-all-sub-data.js` decodes with `decodeURIComponent(id)` before `getDoc`. |
| **categoryId in addSubData** | Acceptable | Next.js typically decodes `params.id`. If ever needed for bookmarks/encoded URLs, decode in helper or in page before calling. |
| **videoId in Edit** | OK | `video.id` comes from Firestore key; no URL involved. Passed correctly to `updateVideoHandler` and then to `addSubData`. |
| **Consistency** | Improvement | Recommend decoding `categoryId` once in the page (e.g. `decodeURIComponent(params?.id ?? '')`) and passing that to all helpers so behavior is consistent regardless of how the URL was built. |

### 2.2 Document ID and Data Model Issues

- **Category IDs with special characters:** Document ID = category title. Spaces and special characters are allowed in Firestore document IDs. URL encoding/decoding is handled in `get-all-sub-data`; same should be considered for `add-sub-data` and any future delete-video helper when using `categoryId` in `doc()`.
- **Video "id" semantics:** In the list, `video.id` is the **Firestore document field key** (e.g. YouTube ID or link string). The UI shows "Video Link" column as `video.id`. Renaming this to something like `videoKey` in the helper return type would reduce confusion with Firestore document IDs.

### 2.3 Error Handling

| Area | Current behavior | Gap |
|------|------------------|-----|
| **fetchVideos** | On error, `fetchedVideosResponse.error` is set; no toast, no UI state. List stays previous or null. | No user-visible error; no retry. |
| **onSubmit (create/update)** | On `addDataResaponse.error`, shows error toast. Does not close modal or clear form. | Missing success toast; modal closes even when update fails if implementation doesn’t guard. |
| **addSubData** | `updateDoc` is not awaited in `add-sub-data.js`. | Caller may assume completion before write finishes; errors may not surface correctly. |

### 2.4 Loading State

- **Initial load:** No loading indicator. `videos` is `null` until first fetch; table body renders nothing until `videos` is set. No spinner/skeleton.
- **After create/update:** `await fetchVideos()` refetches list; no explicit loading state during refetch.
- **Recommendation:** Add `loading` (or `isLoading`) state: set true before fetch, false after; show skeleton or spinner when `loading && !videos`.

### 2.5 Confirmation Before Deletion

- **Delete:** Not implemented. No confirmation dialog, no Firestore call, no refresh.
- **Recommendation:** Use Chakra `AlertDialog` (or similar) to confirm before calling delete-video logic.

### 2.6 List Refresh After Deletion

- **Current:** N/A (delete not implemented).
- **Required:** After successful delete, call `fetchVideos()` (or equivalent) and show success toast; on error show error toast and keep list as-is.

---

## 3. Implementation Status: Edit vs Delete

### 3.1 Edit — Partially Implemented

| Aspect | Status | Notes |
|--------|--------|-------|
| **Button and handler** | Done | `updateVideoHandler(video.id)` opens modal and fills form. |
| **Modal and form** | Done | Same modal as create; mode "update"; title and videoId fields. |
| **Firestore update** | Done | `addSubData(..., categoryId, selectedVideo.id, values.title, values.videoId)` uses `updateDoc` to set `{ [videoId]: _titleVideo }`. |
| **Success feedback** | Missing | No success toast after update. |
| **Changing video key in Edit** | Not supported | Form shows "Video Link" (videoId). In `addSubData`, update branch only uses existing `videoId` and new title; changing the link in the form does not remove the old field or add a new one. To support "change link" would require: delete old field, add new field (or one atomic update with both). |
| **Await updateDoc** | Bug | In `add-sub-data.js`, `updateDoc(docRef, docData)` is not awaited; should be `await updateDoc(...)`. |

### 3.2 Delete — Not Implemented (Stub)

| Aspect | Status | Notes |
|--------|--------|-------|
| **Button** | Present | No `onClick`. |
| **Handler** | Missing | No `deleteVideoHandler(videoId)` (or similar). |
| **Firestore** | Missing | No helper to remove one field from the category document. `delete-data.js` deletes the whole document and must not be used for "delete video." |
| **Confirmation** | Missing | No dialog. |
| **Refresh and toasts** | N/A | To be added with delete implementation. |

---

## 4. Required Improvements (Checklist)

### 4.1 Cross-cutting

- [ ] **Decode categoryId once in page:** e.g. `const categoryId = params?.id ? decodeURIComponent(params.id) : undefined` (and handle empty string if needed) so all helpers receive a consistent decoded id.
- [ ] **Loading state:** Add `isLoading` (or `loading`) for initial fetch and optionally for refetch; show skeleton/spinner when loading.
- [ ] **Error handling for fetchVideos:** On error, show toast and optionally set `videos` to `[]` so UI is predictable.
- [ ] **Success toast on create/update:** After successful `addSubData`, show success toast, then close modal and refetch.
- [ ] **Await updateDoc in add-sub-data.js:** Use `await updateDoc(docRef, docData)` and ensure caller can rely on completion and errors.

### 4.2 Edit

- [ ] Add success toast after successful update.
- [ ] (Optional) Support changing the video link in Edit: implement "delete old field + add new field" (or equivalent) and document semantics (e.g. key uniqueness).

### 4.3 Delete

- [ ] Add Firestore helper to delete a single video field: e.g. `deleteVideoField(collectionName, categoryId, videoId)` using `updateDoc(ref, { [videoId]: deleteField() })`.
- [ ] Add `deleteVideoHandler(videoId)` that: opens confirmation dialog → on confirm calls helper → on success shows toast and calls `fetchVideos()` → on error shows error toast.
- [ ] Wire Delete button: `onClick={() => deleteVideoHandler(video.id)}`.
- [ ] Ensure `categoryId` passed to delete helper is decoded (if not already normalized in page).

### 4.4 Architecture Layers to Involve

| Layer | Responsibility |
|-------|----------------|
| **Page component** | Decode `params.id`; manage loading, list state, modal, and delete dialog; call helpers; show toasts; refetch after mutations. |
| **Firestore helpers** | `get-all-sub-data.js` (already used), `add-sub-data.js` (fix await), new `delete-video-field.js` (or extend one module) for field removal. |
| **No separate services layer** | Current pattern is page → helpers; acceptable to keep. If you introduce a services layer later, it would wrap Firestore helpers and expose `fetchVideos(categoryId)`, `createVideo(...)`, `updateVideo(...)`, `deleteVideo(...)`. |
| **State** | Local `useState` for `videos`, `loading`, `selectedVideo`, modal/dialog open state; no global store required for this page. |

---

## 5. Recommended Final Architecture

### 5.1 Data Flow

```
Route /videos/[id]
  → params.id (decoded once as categoryId)
  → fetchVideos(categoryId) → getSubDouments('categories', categoryId)
  → setVideos(result), setLoading(false)
  → Table: videos.map(video) → Edit [updateVideoHandler(video.id)] | Delete [deleteVideoHandler(video.id)]

Edit path:
  updateVideoHandler(id) → setSelectedVideo(video), setValue(...), onOpen()
  → User submits → onSubmit → addSubData('categories', categoryId, selectedVideo.id, values.title, values.videoId)
  → success: toast, fetchVideos(), onClose(); error: toast only

Delete path:
  deleteVideoHandler(videoId) → open AlertDialog
  → on confirm → deleteVideoField('categories', categoryId, videoId)
  → success: toast, fetchVideos(), close dialog; error: toast, close dialog
```

### 5.2 Firestore Helpers (Final Shape)

| Helper | Purpose | Notes |
|--------|---------|--------|
| **getSubDouments(collectionName, id)** | List video fields of category doc | Already decodes id; returns `{ result: [{ id, title, categoryId }], error }`. |
| **addSubData(collectionName, categoryId, videoId, titleVideo, linkVideo)** | Create or update video field | Await `updateDoc` in update branch; decode categoryId if needed. |
| **deleteVideoField(collectionName, categoryId, videoId)** | Remove one video field | New. `updateDoc(doc(db, collectionName, categoryId), { [videoId]: deleteField() })` with `deleteField()` from `firebase/firestore`. Return `{ result, error }`. |

### 5.3 Edge Cases to Handle

| Case | Handling |
|------|----------|
| **categoryId missing or invalid** | Don’t call fetch; show message or redirect. Already partially done with `if (!categoryId) return` in fetchVideos. |
| **Empty category document** | get-all-sub-data returns `[]`; table shows empty. No change needed. |
| **User edits and changes video link** | Current behavior: only title is updated. Either document this or implement "change key" (delete old field, add new) and handle duplicate key. |
| **Delete last video in category** | Document becomes empty; next list returns `[]`. No special UI required unless product wants to show "empty state" copy. |
| **Concurrent edit/delete** | Optimistic update optional; at minimum show error toast if Firestore fails (e.g. permission or stale). |
| **Very long categoryId or videoId** | Firestore limits apply; ensure IDs are not unbounded (e.g. from URL length). No extra decode beyond `decodeURIComponent`. |
| **params is a Promise (Next.js 15+)** | If upgrading, resolve params (e.g. `use(params)` or async component) before using `params.id`; then same decode and flow. |

---

## 6. Future Delete Implementation (Spec)

### 6.1 Firestore

- **New helper** (e.g. `delete-video-field.js` or similar):
  - Signature: `deleteVideoField(collectionName, categoryId, videoId)`.
  - Implementation: `updateDoc(doc(db, collectionName, categoryId), { [videoId]: deleteField() })` with `import { deleteField } from 'firebase/firestore'`.
  - Return: `{ result: undefined | void, error: null | Error }` for consistency with other helpers.
  - Use decoded `categoryId` (page or helper).

### 6.2 UI and Flow

1. **Delete button** → `onClick={() => deleteVideoHandler(video.id)}`.
2. **deleteVideoHandler(videoId):**
   - Set state for "video to delete" (e.g. `videoToDelete = videoId`).
   - Open Chakra `AlertDialog` (title e.g. "Delete video?", description, Cancel / Delete).
3. **On confirm:**
   - Optionally set a short "deleting" state (e.g. disable button or show spinner).
   - Call `deleteVideoField('categories', categoryId, videoId)`.
   - On success: show success toast, call `fetchVideos()`, clear `videoToDelete`, close dialog.
   - On error: show error toast, close dialog (or keep open for retry).
4. **List refresh:** Use existing `fetchVideos()` after successful delete; no need for optimistic remove unless desired.

---

## 7. Future Edit Implementation (Spec)

### 7.1 Current Approach (Modal + updateDoc)

- **Keep:** Edit opens same modal as create; form pre-filled; submit calls `addSubData` with `selectedVideo.id` and new title.
- **Add:** Success toast after update; ensure `await updateDoc` in `add-sub-data.js` so errors and completion are correct.
- **Optional:** If product requires "change video link" in Edit: in `onSubmit`, if `values.videoId !== selectedVideo.id`, call deleteVideoField for old id and addSubData for new id (or one helper that does both); handle duplicate key if new id already exists.

### 7.2 Alternative: Dedicated Edit Page

- **Route:** e.g. `/videos/[categoryId]/edit/[videoId]`.
- **Flow:** Navigate to edit page → load category + single video server-side or client-side → form → submit → `updateDoc` (or addSubData) → redirect back to list with toast.
- **When to use:** If edit form grows (e.g. many fields, preview) or you want shareable edit URLs. Not required for current single-doc field update.

---

## 8. UX Recommendations

| Topic | Recommendation |
|------|----------------|
| **Confirmation before delete** | Use `AlertDialog` with clear "Cancel" and "Delete" (destructive style). Optionally show video title in the message. |
| **Optimistic updates** | Optional: for delete, remove row from UI immediately and revert on error with toast. For edit, update row in state on success without full refetch if list is large. |
| **Error handling** | Every Firestore mutation: on error, show toast with short message; do not close modal/dialog on error so user can retry or copy data. |
| **Loading** | Initial load: skeleton or spinner. After create/update/delete: optional small loading on button or table body during refetch. |
| **Empty state** | When `videos?.length === 0` and not loading, show a short message (e.g. "No videos in this category") and primary action "Add video" (opens modal). |
| **Success feedback** | Toast for create, update, and delete so the user gets clear confirmation. |

---

## 9. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02 | Initial analysis and spec: current state, verification, required improvements, final architecture, future Delete/Edit specs, UX recommendations. |
