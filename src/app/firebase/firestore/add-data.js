import firebase_app from "../config";
import { getFirestore, doc, setDoc,addDoc, collection } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function addData(selectedCollection,  data) {
    let result = null;
    let error = null;

    try {
        result = await setDoc(doc(db, selectedCollection, data.title),{});
    } catch (e) {
        console.log(e);
        error = e;
    }
    return { result, error };
}
