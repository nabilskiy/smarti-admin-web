import firebase_app from "../config";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function getSubDouments(collectionName, id) {
    let result = [];
    let error = null;
    const decodedId = decodeURIComponent(id);
    try {
        const videoCategoryData = await getDoc(doc(db, collectionName, decodedId));
        const data = videoCategoryData.exists() ? videoCategoryData.data() : null;
        if (!data || typeof data !== 'object') {
            return { result: [], error: null };
        }
        const keys = Object.keys(data);
        keys.forEach(key => {
            result.push({
                id: key,
                title: data[key],
                categoryId: decodedId,
            });
        });
    } catch (e) {
        console.log(e)
        error = e;
    }

    return { result, error };
}

