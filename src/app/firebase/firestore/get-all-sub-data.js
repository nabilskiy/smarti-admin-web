import firebase_app from "../config";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function getSubDouments(collectionName, id) {
    let result = [];
    let error = null;
    
    try {
        const videoCategoryData = await getDoc(doc(db, collectionName, id));
        const keys = Object.keys(videoCategoryData.data())
        keys.forEach(key => {
          result.push({
                id: key,
                title: videoCategoryData.data()[key],
                categoryId: id,
            })
        })
    } catch (e) {
        console.log(e)
        error = e;
    }

    return { result, error };
}

