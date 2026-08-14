import firebase_app from "../config";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";

export default async function signIn(email, password) {
    let result = null,
        error = null;
    try {
        result = await signInWithEmailAndPassword(getAuth(firebase_app), email, password);
    } catch (e) {
        error = e;
    }

    return { result, error };
}
