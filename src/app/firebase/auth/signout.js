import firebase_app from "../config";
import { signOut, getAuth } from "firebase/auth";

export default async function signOutAndExit() {
    let result = null,
        error = null;
    try {
        result = await signOut(getAuth(firebase_app));
    } catch (e) {
        error = e;
    }

    return { result, error };
}
