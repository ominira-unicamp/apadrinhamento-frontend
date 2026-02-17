import { createContext, ReactNode, useEffect, useState } from "react";

import { authService } from "../services/auth/AuthService";

import { ApiException } from "../errors/ApiException";

import { AxiosError } from "axios";


interface IUserData {
    name: string;
    token: string;
    role: string;
    status: boolean;
}

interface LoginData {
    email: string;
    password: string;
}

interface IUserContextData extends IUserData{

    login: (params: LoginData) => Promise<boolean>;
    logout: () => Promise<void>;
    verify: () => Promise<void>;
}

const getInitialState = (): IUserData => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : { name: '', token: '', role: '', status: false };
}
export const AuthContext = createContext<IUserContextData>({} as IUserContextData);

export const AuthContextProvider: React.FC<React.PropsWithChildren<object>> = ({ children }): ReactNode => {
    const [user, setUser] = useState(getInitialState);

    useEffect(() => {
        localStorage.setItem('user', JSON.stringify(user));
    }, [user])

    // Função para Login
    const handleLogin = async (data: LoginData): Promise<any> => {
            try {
                const response = await authService.login(data);

                setUser({
                    name: response.data.name || '',
                    token: response.data.access_token,
                    status: response.data.status,
                    role: response.data.role || ''
                } as IUserData);
                return response.data.status;
            }
            catch ( error: unknown ) {
                throw error;
            }
    };  

    // Função para Logout
    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    setUser({} as IUserData);
                    return;
                }
            }
            console.error('Failed logout Attempt: ', error);
            throw error;
        } finally {
            setUser({} as IUserData);
        }

    };

    const verify = async (): Promise<void> => {
        try {
            await authService.verify();

        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    setUser({} as IUserData);

                    throw new ApiException('Usuário não autenticado.');
                } else if ( error.response?.status === 429 ) {
                    return;
                }
            }

            setUser({} as IUserData);

            throw new ApiException('Usuário não autenticado.');
        }
    };

    return (
        <AuthContext.Provider value={{ name: user.name, token: user.token, role: user.role, status: user.status, login: handleLogin, logout: handleLogout, verify: verify }}>
            {children}
        </AuthContext.Provider>
    );
}