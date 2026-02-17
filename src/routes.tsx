import { BrowserRouter, Routes, Outlet, Navigate, Route } from "react-router-dom"

import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

import { SignupPage, LoginPage, LandPage, HomePage, ApprovalPage, StatsPage, GodparentingPage, ResultPage, AdminDashboardPage, AllUsersPage, ResetPasswordPage, ForgotPasswordPage, TermsOfServicePage } from "./pages";
import { TermsOfServiceFooter } from "./components";

const PrivateRoutes = () => {
    const auth = useAuth();
    
    useEffect(() => {
        try {
            auth.verify();
        } catch (error: unknown) {
            console.error(error)
        }
    }, [auth])

    return (
      auth.token ? <Outlet/> : <Navigate to='/login'/>
    )
}

const AdminRoute = () => {
    const auth = useAuth();

    if (auth.role !== "ADMIN") {
        return <Navigate to='/dashboard' replace />;
    }

    return <Outlet/>;
}

export const AppRoutes = () => {

    return (
        <BrowserRouter>
            <>
                <Routes>
                    <Route element={<PrivateRoutes/>}>
                        <Route path="*" element={<Navigate to='/'/>}/>
                        <Route path="/dashboard" element={<HomePage/>}/>
                        <Route element={<AdminRoute/>}>
                            <Route path="/admin" element={<AdminDashboardPage/>}/>
                            <Route path="/admin/approval" element={<ApprovalPage/>}/>
                            <Route path="/admin/users" element={<AllUsersPage/>}/>
                            <Route path="/admin/stats" element={<StatsPage/>}/>
                            <Route path="/admin/godparenting" element={<GodparentingPage/>}/>
                        </Route>
                        <Route path="/results" element={<ResultPage/>}/>
                    </Route>

                    <Route path="/" element={<LandPage />}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/signup" element={<SignupPage/>}/>
                    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
                    <Route path="/termos" element={<TermsOfServicePage/>}/>
                </Routes>
                <TermsOfServiceFooter />
            </>
        </BrowserRouter>
    )
}