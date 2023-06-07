import firebase_app from "../config";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const db = getFirestore(firebase_app)
export default async function getSubDouments(collectionName, id, subCollectionName) {
    let result = [];
    let error = null;

    try {
        const querySnapshot = await getDocs(collection(db, `${collectionName}/${id}/${subCollectionName}`));
        querySnapshot.forEach((doc) => {
            result.push({
                id: doc.id,
                categoryId: id,
                ...doc.data()
            })
        });
    } catch (e) {
        error = e;
    }

    return { result, error };
}

