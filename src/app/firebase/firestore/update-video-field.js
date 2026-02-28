/**
 * update-video-field.js
 *
 * Updates a video stored as a field on the category document (key = video ID, value = title).
 * Supports changing both the field key (logical ID) and the value string.
 *
 * Update flow (copy-and-delete for key change):
 * 1. getDoc(categoryRef) to read current data.
 * 2. Validate: old key exists, new key not already present (if renaming), IDs non-empty and trimmed.
 * 3. If same key: updateDoc(ref, { [key]: newTitle }).
 * 4. If new key: updateDoc(ref, { [newKey]: newTitle, [oldKey]: deleteField() }) — atomic on single doc.
 *
 * Risks and safeguards:
 * - Non-atomic read then write: another client could add newKey between getDoc and updateDoc.
 *   Safeguard: we check data[newKey] in the read snapshot and refuse if present.
 * - Partial failure: updateDoc is atomic for this document; no orphaned or half-updated state.
 * - Broken references: TV app / external refs that store the old key will break after rename; no
 *   server-side refs in this app; document in UX if needed.
 */
import firebase_app from "../config";
import { getFirestore, doc, getDoc, updateDoc, deleteField } from "firebase/firestore";

const db = getFirestore(firebase_app);

function decodeId(id) {
    return id != null && typeof id === "string" ? decodeURIComponent(id) : id;
}

/**
 * Update a video field: allows changing both the field key (logical ID) and the value (title).
 * Uses copy-and-delete for key change: add new field with new key + value, then remove old field.
 * Single document only; no schema or collection changes.
 *
 * @param {string} collectionName - e.g. 'categories'
 * @param {string} categoryId - Category document ID (decoded)
 * @param {string} oldVideoId - Current field key (existing video ID)
 * @param {string} newVideoId - New field key (trimmed; must not exist if different from old)
 * @param {string} newTitle - New value string (title)
 * @returns {{ result: undefined, error: Error|null }}
 */
export default async function updateVideoField(
    collectionName,
    categoryId,
    oldVideoId,
    newVideoId,
    newTitle
) {
    let error = null;
    const decodedCategoryId = decodeId(categoryId);

    const trimmedOld = oldVideoId != null ? String(oldVideoId).trim() : "";
    const trimmedNew = newVideoId != null ? String(newVideoId).trim() : "";
    const trimmedTitle = newTitle != null ? String(newTitle).trim() : "";

    if (!trimmedOld) {
        return { result: undefined, error: new Error("Current video ID is required") };
    }
    if (!trimmedNew) {
        return { result: undefined, error: new Error("Video ID cannot be empty") };
    }

    try {
        const docRef = doc(db, collectionName, decodedCategoryId);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            return { result: undefined, error: new Error("Category not found") };
        }

        const data = snapshot.data();
        if (!data || typeof data !== "object") {
            return { result: undefined, error: new Error("Category has no data") };
        }

        if (data[trimmedOld] === undefined) {
            return { result: undefined, error: new Error("Video not found") };
        }

        if (trimmedNew !== trimmedOld && data[trimmedNew] !== undefined) {
            return { result: undefined, error: new Error("A video with this ID already exists") };
        }

        if (trimmedNew === trimmedOld) {
            await updateDoc(docRef, { [trimmedOld]: trimmedTitle });
        } else {
            await updateDoc(docRef, {
                [trimmedNew]: trimmedTitle,
                [trimmedOld]: deleteField(),
            });
        }
    } catch (e) {
        console.error(e);
        error = e;
    }

    return { result: undefined, error };
}
