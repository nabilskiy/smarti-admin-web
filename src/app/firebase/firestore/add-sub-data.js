import firebase_app from "../config";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";

const db = getFirestore(firebase_app);

function decodeId(id) {
    return id != null && typeof id === "string" ? decodeURIComponent(id) : id;
}

export default async function addSubData(selectedCollection, categoryId, videoId, _titleVideo, _linkVideo) {
    let result = null;
    let error = null;
    const decodedCategoryId = decodeId(categoryId);
    try {
        if (videoId) {
            const docData = { [videoId]: _titleVideo };
            const docRef = doc(db, selectedCollection, decodedCategoryId);
            await updateDoc(docRef, docData);
        } else {
            const docData = { [_linkVideo]: _titleVideo };
            await setDoc(doc(db, selectedCollection, decodedCategoryId), docData, { merge: true });
        }
    } catch (e) {
        console.error(e);
        error = e;
    }
    return { result, error };
}
