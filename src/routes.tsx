import { BrowserRouter, Routes, Outlet, Navigate, Route } from "react-router-dom"

import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

import { SignupPage, LoginPage, LandPage, HomePage, ApprovalPage, StatsPage, GodparentingPage, ResultPage } from "./pages";

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

export const AppRoutes = () => {

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PrivateRoutes/>}>
                {/* <Route element={<Outlet/>}> */}
                    <Route path="*" element={<Navigate to='/'/>}/>
                    <Route path="/dashboard" element={<HomePage/>}/>
                    <Route path="/admin/approval" element={<ApprovalPage/>}/>
                    <Route path="/admin/stats" element={<StatsPage/>}/>
                    <Route path="/admin/godparenting" element={<GodparentingPage/>}/>
                    <Route path="/results" element={<ResultPage/>}/>
                </Route>

                <Route path="/" element={<LandPage />}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/signup" element={<SignupPage/>}/>
            </Routes>
        </BrowserRouter>
    )
}