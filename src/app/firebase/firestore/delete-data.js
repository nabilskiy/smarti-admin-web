import firebase_app from "../config";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function deleteDocuemnt(collectionName, id) {
    let result = [];
    let error = null;

    try {
         result = await deleteDoc(doc(db, collectionName, id));
    } catch (e) {
        error = e;
    }

    return { result, error };
}

