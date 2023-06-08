import firebase_app from "../config";
import { getFirestore, doc, setDoc} from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function addData(selectedCollection, title, videoId, videoTitle) {
    let result = null;
    let error = null;
    
    const docData = {};
    docData[videoId] = videoTitle;
    try {
        result = await setDoc(doc(db, selectedCollection, title), docData);
    } catch (e) {
        console.log(e);
        error = e;
    }
    return { result, error };
}
