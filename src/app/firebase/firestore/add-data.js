import firebase_app from "../config";
import { getFirestore, doc, setDoc,addDoc, collection } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function addData(selectedCollection, id, data) {
    let result = null;
    let error = null;

    try {
        if (id) {
            result = await setDoc(doc(db, selectedCollection, id), data, {
                merge: true,
            });
        } else {
            const newCategoryRef = collection(db, selectedCollection);
            result = await addDoc(newCategoryRef, data);
        }
    } catch (e) {
        console.log(e);
        error = e;
    }

    return { result, error };
}
