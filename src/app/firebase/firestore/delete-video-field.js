import firebase_app from "../config";
import { getFirestore, doc, updateDoc, deleteField } from "firebase/firestore";

const db = getFirestore(firebase_app);

/**
 * Removes a single video field from a category document.
 * @param {string} collectionName - e.g. 'categories'
 * @param {string} categoryId - document ID (decoded)
 * @param {string} videoId - field key to remove
 * @returns {{ result: undefined, error: Error|null }}
 */
export default async function deleteVideoField(collectionName, categoryId, videoId) {
    let error = null;
    try {
        const docRef = doc(db, collectionName, categoryId);
        await updateDoc(docRef, { [videoId]: deleteField() });
    } catch (e) {
        console.error(e);
        error = e;
    }
    return { result: undefined, error };
}
