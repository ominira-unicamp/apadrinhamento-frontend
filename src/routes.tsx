import { BrowserRouter, Routes, Outlet, Navigate, Route } from "react-router-dom"

import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

import { SignupPage, LoginPage, LandPage, HomePage, ApprovalPage, StatsPage, GodparentingPage, ResultPage, AdminDashboardPage, AllUsersPage, ResetPasswordPage, ForgotPasswordPage, WhiteboardPage, TinderPage, LogoutPage } from "./pages";

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
            <Routes>
                <Route element={<PrivateRoutes/>}>
                {/* <Route element={<Outlet/>}> */}
                    <Route path="*" element={<Navigate to='/'/>}/>
                    <Route path="/dashboard" element={<HomePage/>}/>
                    <Route path="/whiteboard" element={<WhiteboardPage/>}/>
                    <Route path="/tinder" element={<TinderPage/>}/>
                    <Route element={<AdminRoute/>}>
                        <Route path="/admin" element={<AdminDashboardPage/>}/>
                        <Route path="/admin/approval" element={<ApprovalPage/>}/>
                        <Route path="/admin/users" element={<AllUsersPage/>}/>
                        <Route path="/admin/stats" element={<StatsPage/>}/>
                        <Route path="/admin/godparenting" element={<GodparentingPage/>}/>
                    </Route>
                    <Route path="/results" element={<ResultPage/>}/>
                    <Route path="/logout" element={<LogoutPage/>}/>
                </Route>

                <Route path="/" element={<LandPage />}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/signup" element={<SignupPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route path="/reset-password" element={<ResetPasswordPage/>}/>
            </Routes>
        </BrowserRouter>
    )
}