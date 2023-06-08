import firebase_app from "../config";
import { getFirestore, doc, setDoc, updateDoc, collection } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function addSubData(selectedCollection, categoryId, videoId, _titleVideo, _linkVideo ) {
    let result = null;
    let error = null;
    console.log(videoId)
    try {
        if (videoId) {
            const docData = {};
            docData[videoId] = _titleVideo;
            const docRef = doc(db, selectedCollection, categoryId);
            updateDoc(docRef, docData);
        } else {
            const docData = {};
            docData[_linkVideo] = _titleVideo;
            await setDoc(doc(db, selectedCollection, categoryId), docData, { merge: true });
        }
    } catch (e) {
        console.log(e);
        error = e;
    }

    return { result, error };
}
