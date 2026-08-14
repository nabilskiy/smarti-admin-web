import firebase_app from "../config";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";

export default async function signUp(email, password) {
    let result = null,
        error = null;
    try {
        result = await createUserWithEmailAndPassword(getAuth(firebase_app), email, password);
    } catch (e) {
        error = e;
    }

    return { result, error };
}
