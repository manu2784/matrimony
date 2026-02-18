import { createContext } from "react";
import { type AuthContextType } from "../../types/authentication/authentication-types";

export const AuthContext = createContext<AuthContextType | null>(null);