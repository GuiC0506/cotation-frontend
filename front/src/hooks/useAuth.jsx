import { useState, useEffect } from "react";
import { useContext } from "react";
import { createContext } from "react";
import { firebaseConfig } from "../env";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useMemo } from "react";
import { notifyError, notifySuccess } from "@/components/ui/Toast/Toasters";

const AuthContext = createContext({});
export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(() => {
        return JSON.parse(localStorage.getItem("userData")) || {}
    });
    const [authHandler, setAuthHandler] = useState(null);
    const [isLogged, setIsLogged] = useState(false);

    useEffect(() => {
        initializeApp(firebaseConfig);
        setAuthHandler(getAuth());
    }, []);

    const login = async (credentials) => {
        const { email, password } = credentials;
        try {
            const response = await signInWithEmailAndPassword(authHandler, email, password);
            if (response.user.uid) {
                setIsLogged(true);
                setUserData(response.user);
                localStorage.setItem("userData", JSON.stringify(response.user));
                return response;
            }
        } catch (err) {
            throw new Error(err)
        }
    }

    const logout = async () => {
        await signOut(authHandler);
        localStorage.removeItem("userData");
        setUserData({});
        setIsLogged(false);
    }

    const recoverPassword = async (email) => {
        try {
            await sendPasswordResetEmail(authHandler, email)
        } catch (err) {
            notifyError(err.message);
        }
    }

    const createAccount = async (credentials) => {
        const { email, password } = credentials;
        try {
            await createUserWithEmailAndPassword(authHandler, email, password);
            notifySuccess("Account created");
        } catch (err) {
            notifyError(err.message);
        }
    }

    const ctxValue = useMemo(() => ({
        userData,
        setUserData,
        createAccount,
        login,
        logout,
        recoverPassword,
        isLogged
    }), [userData, login]);

    return <AuthContext.Provider value={ctxValue}>{children}</AuthContext.Provider>
}

const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be wrapped inside an AuthProvider");
    }

    return context;
}

export {
    useAuth,
    AuthContext
}
