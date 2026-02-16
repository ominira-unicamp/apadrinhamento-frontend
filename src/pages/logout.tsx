import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export const LogoutPage = () => {
    const authCtx = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        authCtx.logout().then(() => navigate("/login")).catch(console.error);
    }, [authCtx, navigate]);

    return null;
}