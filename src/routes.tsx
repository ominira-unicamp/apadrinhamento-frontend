import { BrowserRouter, Routes, Outlet, Navigate, Route } from "react-router-dom"

import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

import { LoginPage, LandPage, HomePage, ApprovalPage, StatsPage, GodparentingPage, ResultPage, AdminDashboardPage, AllUsersPage, ResetPasswordPage, ForgotPasswordPage, LogoutPage, TermsOfServicePage, SignupForm } from "./pages";
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

const AdminRoutes = () => {
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
                        <Route element={<AdminRoutes/>}>
                            <Route path="/admin" element={<AdminDashboardPage/>}/>
                            <Route path="/admin/approval" element={<ApprovalPage/>}/>
                            <Route path="/admin/users" element={<AllUsersPage/>}/>
                            <Route path="/admin/stats" element={<StatsPage/>}/>
                            <Route path="/admin/godparenting" element={<GodparentingPage/>}/>
                        </Route>
                        {/* <Route path="/results" element={<ResultPage/>}/> */}
                        <Route path="/logout" element={<LogoutPage/>}/>
                    </Route>

                    <Route path="/" element={<LandPage />}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/signup" element={<SignupForm/>}/>
                    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
                    <Route path="/termos" element={<TermsOfServicePage/>}/>
                </Routes>
                <TermsOfServiceFooter/>
            </>
        </BrowserRouter>
    )
}