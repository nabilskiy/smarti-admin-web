import firebase_app from "../config";
import { getFirestore, doc, setDoc, addDoc, collection } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function addSubData(selectedCollection, categoryId, videoId, data) {
    let result = null;
    let error = null;
  
    try {
        if (videoId) {
            const docRef = doc(db, selectedCollection, categoryId, "videos", videoId);
            setDoc(docRef,data);
        } else {
            const docRef = doc(db, selectedCollection, categoryId);
            const videoRef = collection(docRef, "videos");
            await addDoc(videoRef, data);
        }
    } catch (e) {
        console.log(e);
        error = e;
    }

    return { result, error };
}
