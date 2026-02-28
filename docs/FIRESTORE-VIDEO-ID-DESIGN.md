# Firestore Video ID Design — Changing Logical IDs Safely

**Purpose:** Define a production-safe approach for allowing users to change the logical ID of a video, given Firestore’s immutability of document IDs and the current use of a “field as ID” pattern.

**Scope:** Current data model (videos as field names on category documents), risks of changing IDs, and a preferred architecture using auto-generated IDs with an editable logical ID stored as a property.

---

## 1. Current Data Model (Summary)

- **Collection:** `categories`
- **Document ID:** Category identifier (in this app: category title, e.g. `"Test Category"`).
- **Document data:** A single map where each **key** is the video’s logical ID (e.g. YouTube video ID or link) and each **value** is the video’s display title.

Example:

```text
categories / "Test Category"
  └── data: { "dQw4w9WgXcQ": "My Video Title", "abc123": "Another Video" }
```

So each “video” is represented by a **field name** (the logical ID), not by a separate document. There is no `videos` subcollection; the app uses `getDoc` on the category document and iterates `Object.keys(data)` to list videos.

**Implication:** “Changing the video ID” in this model means changing the **field name** (key) in that document. Firestore does not support renaming a field; the only way to “change” it is to add a new field (new key) and remove the old one.

---

## 2. Current Limitation: Why IDs Cannot Be Renamed

### 2.1 Document IDs

- In Firestore, a **document ID** is set at creation time and **cannot be changed**.
- The document path `collectionId/documentId` is immutable. Renaming would require creating a new document and deleting the old one; the old path would no longer exist.

### 2.2 Field Names (Current “Video ID”)

- **Field names** (keys in the document map) are also **not renameable**.
- There is no “rename field” API. The only operations are:
  - **Write** a field (create or overwrite by key).
  - **Delete** a field (`FieldValue.delete()`).
- So to “change” the logical ID when it is the field name, you must:
  1. Write a **new** field with the new key and the same value (and any other data).
  2. **Delete** the old field in the same or a subsequent update.

For a **single document**, both steps can be done in **one** `updateDoc` call, so the “rename” of the field (logical video ID) can be atomic at the document level.

---

## 3. Recommended Implementation (Current Model: Field-as-Key)

For the **existing** design where the video “ID” is the field name on the category document, the safe way to support “change video ID” is a single-document update.

### 3.1 Strategy (Single Document)

1. **Read** the category document (to get the current title for the old key).
2. **Update** the same document in one call:
   - Set `[newVideoId]: title` (and keep any other fields you might add later).
   - Remove the old key: `[oldVideoId]: deleteField()`.

No new document, no delete of the whole document. Only one `updateDoc` on the category document.

### 3.2 Why This Is Safe Here

- All video data for a category lives in **one** document.
- There are no separate “video documents” to create or delete.
- No other collections reference “video IDs” in this app (they are just keys in this doc).
- A single `updateDoc` is atomic: both “add new key” and “remove old key” succeed or fail together for that document.

### 3.3 Example Service-Layer Function (Current Model)

```javascript
// Firestore: updateDoc with new key + deleteField(old key)
import { getFirestore, doc, getDoc, updateDoc, deleteField } from "firebase/firestore";

export async function renameVideoField(collectionName, categoryId, oldVideoId, newVideoId) {
  const db = getFirestore(firebase_app);
  const docRef = doc(db, collectionName, decodeURIComponent(categoryId));

  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    return { result: null, error: new Error("Category not found") };
  }

  const data = snapshot.data();
  const currentTitle = data[oldVideoId];
  if (currentTitle === undefined) {
    return { result: null, error: new Error("Video not found") };
  }

  if (data[newVideoId] !== undefined) {
    return { result: null, error: new Error("Target ID already exists") };
  }

  await updateDoc(docRef, {
    [newVideoId]: currentTitle,
    [oldVideoId]: deleteField(),
  });

  return { result: { newVideoId, title: currentTitle }, error: null };
}
```

### 3.4 Error Handling Strategy

| Case | Handling |
|------|----------|
| Category doc missing | Return error; do not call `updateDoc`. |
| Old video key missing | Return error (e.g. "Video not found"). |
| New key already exists | Return error (e.g. "Target ID already exists") to avoid overwriting. |
| `updateDoc` fails (permissions, network) | Catch, log, return error; UI shows message and does not refresh list optimistically. |
| Empty or invalid IDs | Validate before `getDoc`; return clear error. |

### 3.5 UI Update Strategy After Rename

- **Option A (recommended):** Call the existing “list videos” fetch after a successful rename, then replace list state. No optimistic update of the single item to avoid desync if the new key has different semantics (e.g. URL).
- **Option B:** Optimistic update: replace the item in local state (old key → new key, same title) and then refetch in the background to confirm; on refetch error, revert or show error.

### 3.6 Edge Cases (Current Model)

- **oldVideoId === newVideoId:** No-op; return success without calling Firestore.
- **newVideoId already exists:** Refuse and return error (see above).
- **Concurrent renames:** Two users rename the same “video” (same old key) to different new keys: last write wins for that document; no transaction across users. Acceptable for single-doc, or document in product requirements.
- **Category ID / URL encoding:** Decode `categoryId` once (e.g. `decodeURIComponent`) when building `docRef` so encoded URLs (e.g. `Test%20Category`) work.

---

## 4. Risks and Mitigation

### 4.1 If Videos Were Stored as Documents (Hypothetical)

If each video were a **document** in a subcollection (e.g. `categories/{id}/videos/{videoId}`) and the **document ID** were the user-facing “video ID”:

- **Strategy would be:** read old document → create new document with new ID (copy data) → delete old document.
- **Risks:**
  - **Non-atomic:** Read → create → delete is three operations; a failure after create could leave a duplicate or orphan.
  - **Broken references:** Any other collection or doc that stores `categoryId` + `videoId` would point to the old path after rename; those references would break unless updated.
  - **Partial failure:** If delete fails after create, you have two documents for “the same” video.
  - **URL dependencies:** If URLs or deep links embed the old video ID, they would 404 or show wrong data until clients and caches are updated.

**Mitigation (for that hypothetical):**

- Use a **batched write** to create new doc and delete old doc in one batch (same category doc or same subcollection). You cannot “rename” in one op, but you can make the switch atomic.
- **Do not** use the document ID as the user-editable “video ID.” Use auto-generated IDs and store the logical ID in a field (see Alternative Architecture below). Then “rename” is a single `updateDoc` on that field.

### 4.2 Current Model (Field-as-Key) — Risk Level

- **References:** No other collections reference these field names in this app; risk of broken references is low.
- **Atomicity:** One `updateDoc` for add new key + delete old key; atomic for that document.
- **Partial failure:** Only one write; no “half-renamed” state.
- **URLs:** If any URL or share link embeds the video key, changing it will break those links; document this for product/UX.

### 4.3 Transaction vs Batched Write

- **Single document (current field-rename):** No transaction needed. One `updateDoc(ref, { [newKey]: value, [oldKey]: deleteField() })` is already atomic for that document.
- **Multiple documents (e.g. if you had refs in other collections):** Use a **transaction** or **batched write** so that:
  - All related documents are updated (e.g. create new video doc, delete old, update any “reference” docs) in one atomic unit, or
  - None of them are.
- **Recommendation for current app:** No transaction; single `updateDoc` is enough. If you later move to a subcollection and still need to update multiple docs for one logical rename, then introduce a batch or transaction.

---

## 5. Alternative Architecture (Preferred Long-Term)

Using the **field name as the video ID** works but has drawbacks:

- Rename requires add-new-key + delete-old-key and careful handling of duplicates.
- Field names have character/size constraints and can be awkward (e.g. full URLs as keys).
- Querying or indexing “by video” is limited to what you can do on a single document’s keys.

A **safer and more scalable** design is to store each video as its **own document** with an **auto-generated document ID**, and keep the user-editable “video ID” (e.g. YouTube ID, slug, or link) as a **normal field**.

### 5.1 Proposed Structure

```text
categories / { categoryId }     (unchanged: category document, e.g. name, metadata)
  videos (subcollection) / { videoDocId }   (auto-generated, e.g. from addDoc)
    └── fields:
          videoId: string     // editable logical ID (YouTube ID, slug, link)
          title: string      // display title
          createdAt?: timestamp
```

- **Document ID:** Auto-generated (e.g. `addDoc(collection(ref, "videos"), data)`). Never shown as the “video ID” in the UI; never changed.
- **Logical ID:** Stored in a field (e.g. `videoId`). User can “rename” it by updating this field with `updateDoc`.

### 5.2 Why This Is Better

| Aspect | Field-as-Key (Current) | Subcollection + Auto-ID (Preferred) |
|--------|------------------------|--------------------------------------|
| Change “video ID” | Add new key + delete old key; check duplicates manually. | Single `updateDoc` on `videoId` field. |
| Uniqueness | Enforced only in app (check before write). | Can enforce with security rules + optional unique index (e.g. in another store). |
| Query / scale | All videos in one doc; document size limit (1 MiB). | One doc per video; scales with subcollection. |
| Refactor / APIs | Field names are “magic”; keys = IDs. | Clear schema: `videoId`, `title`; easier to extend (e.g. thumbnails, order). |
| Deep links / URLs | Often encode the key; changing key breaks links. | URLs can use stable `videoDocId`; display uses `videoId`; rename does not break doc path. |

### 5.3 Example Implementation (Preferred Model)

```javascript
// List videos
async function getVideos(collectionName, categoryId) {
  const ref = collection(db, collectionName, decodeURIComponent(categoryId), "videos");
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

// Create video (auto-generated doc ID)
async function createVideo(collectionName, categoryId, videoId, title) {
  const ref = collection(db, collectionName, decodeURIComponent(categoryId), "videos");
  const docRef = await addDoc(ref, { videoId, title, createdAt: serverTimestamp() });
  return { result: { docId: docRef.id, videoId, title }, error: null };
}

// Update video (including “rename” logical ID)
async function updateVideo(collectionName, categoryId, videoDocId, updates) {
  const docRef = doc(db, collectionName, decodeURIComponent(categoryId), "videos", videoDocId);
  await updateDoc(docRef, updates); // e.g. { videoId: newId, title: newTitle }
  return { result: updates, error: null };
}

// Delete video (delete document)
async function deleteVideo(collectionName, categoryId, videoDocId) {
  const docRef = doc(db, collectionName, decodeURIComponent(categoryId), "videos", videoDocId);
  await deleteDoc(docRef);
  return { result: undefined, error: null };
}
```

- **Rename:** Call `updateVideo(..., videoDocId, { videoId: newVideoId })`. No new document, no delete of another doc; one atomic update.
- **Error handling:** Same ideas as before: validate inputs, check doc exists if needed, handle “duplicate videoId” in app or via rules, surface errors to UI.

### 5.4 UI After Rename (Preferred Model)

- **Success:** Refetch the videos list (or update local state for that one document: replace `videoId` for the same `docId`), then show success toast.
- **Optimistic:** Update local state with new `videoId`, then call `updateVideo`; on error, revert and show error.

### 5.5 Edge Cases (Preferred Model)

- **Duplicate `videoId` in same category:** Decide policy (allow vs unique). If unique, check before update or enforce in rules; return clear error.
- **Stable URLs:** Prefer URLs that use `videoDocId` (stable) so renaming `videoId` does not break links; use `videoId` only for display/embed.

---

## 6. Migration Strategy (If Moving to Preferred Architecture)

If you keep the current field-as-key model in production and later want to move to the subcollection + auto-ID model:

### 6.1 High-Level Steps

1. **Add new Firestore helpers** for the subcollection model (create/read/update/delete by `docId`, with `videoId` and `title` fields).
2. **Dual-write (optional):** When creating/updating videos, write to both:
   - Current: category doc fields (for backward compatibility), and
   - New: `videos` subcollection (for new clients).
3. **Backfill:** One-time script (or admin tool): for each category document, iterate `Object.keys(data)`, and for each key create a document in `categories/{categoryId}/videos` with `videoId: key`, `title: data[key]`.
4. **Switch reads:** Change the app to read only from the subcollection; stop reading video list from category document fields.
5. **Switch writes:** Create/update/delete only in the subcollection.
6. **Remove legacy:** After verification, stop writing the video fields on the category document; optionally run a cleanup to remove those fields (or leave for audit).

### 6.2 Safety During Migration

- Run backfill in small batches (e.g. by category) and verify counts and sample data.
- Use feature flags or versioned APIs so you can roll back to “read from category doc” if issues appear.
- Do not delete the old field-based data until the new model is proven in production.

### 6.3 No Migration (Stay on Current Model)

If you do **not** migrate:

- Implement the **single-document rename** (new key + `deleteField(old key)`) as in section 3.
- Add the `renameVideoField`-style helper and wire it in the UI when the user “changes” the video ID/link.
- Document that “changing video ID” breaks any external URLs that embed the old key.

---

## 7. Summary

| Topic | Conclusion |
|-------|------------|
| **Why IDs can’t be “renamed”** | Document IDs and field names are immutable; you can only add/delete or create a new doc. |
| **Current model (field-as-key)** | “Rename” = one `updateDoc`: set `[newVideoId]: title`, `[oldVideoId]: deleteField()`. Atomic, no transaction. |
| **Risks** | Low for single-doc update; higher if you had multiple docs or external refs; document URL breakage if links embed the key. |
| **Transaction / batch** | Not required for single-doc field rename; use batch/transaction only if you introduce multi-doc updates. |
| **Preferred design** | Subcollection `videos` with auto-generated document IDs and `videoId` + `title` as fields; “rename” = update one field. |
| **Migration** | Optional: dual-write, backfill, switch reads/writes, then remove legacy field-based storage. |

This gives you a clear, production-oriented path for supporting ID changes in the current design and a scalable alternative for future versions.
