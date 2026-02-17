import { useEffect, useState } from "react";
import { SignupForm } from "./signupForm";
import { TinderPage } from "./tinder";
import { WhiteboardPage } from "./whiteboard";
import { useAuth } from "../hooks/useAuth";

type SignupStep = "form" | "second-step";

export const SignupPage = () => {
    const authCtx = useAuth();
    const [currentPage, setCurrentPage] = useState<SignupStep>("form");
    const [userRole, setUserRole] = useState<"bixe" | "veterane">();

    const handleSignupComplete = (role: "bixe" | "veterane") => {
        setUserRole(role);
        setCurrentPage("second-step");
    };

    useEffect(() => {
        if (authCtx.token && authCtx.status === false && currentPage === "form") {
            const role = authCtx.role as "bixe" | "veterane";
            setUserRole(role);
            setCurrentPage("second-step");
        }
    }, [authCtx.token, authCtx.status, authCtx.role, currentPage]);

    if (currentPage === "form") {
        return <SignupForm onSignupComplete={handleSignupComplete} />;
    }

    if (userRole === "bixe") {
        return <TinderPage />;
    }

    return <WhiteboardPage />;
};
