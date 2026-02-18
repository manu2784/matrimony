import { type AuthContextType } from "../../types/authentication/authentication-types";
import { useContext } from "react";
import { AuthContext } from "./authContext";


export const useAuth: () => AuthContextType = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("AuthContext not found");
    return ctx;
};