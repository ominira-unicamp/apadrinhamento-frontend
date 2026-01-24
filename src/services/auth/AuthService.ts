import { AxiosError, AxiosResponse } from "axios";
import { Api } from "../ApiConfig";
import { ApiException } from "../../errors/ApiException";
import { UnauthorizedException } from "../../errors/UnauthorizedException";

interface LoginData {
    email: string;
    password: string;
}

interface SignupData {
    email: string;
    password: string;
    name: string;
    telephone: string;
    course: "CC" | "EC";
    role: "bixe" | "veterane";
    yearOfEntry: number;
    pronouns?: string[];
    ethnicity?: string[];
    city?: string;
    lgbt?: string[];
    parties?: number;
    hobby?: string;
    music?: string;
    games?: string;
    sports?: string;
}

const login = async (authData: LoginData): Promise<AxiosResponse> => {
    try {
        const response = await Api().post('/auth/login', authData);
        return response;
    } catch (error: unknown) {
        if (error instanceof AxiosError && error.status === 401) {
            throw new UnauthorizedException('Usuário ou senha inválidos.');
        }
        throw new ApiException('Erro ao buscar os registros.')
    }
}

const signup = async (signupData: SignupData): Promise<AxiosResponse> => {
    try {
        const response = await Api().post('/users/signup', signupData);
        return response;
    } catch (error: unknown) {
        console.error('Signup error:', error);
        if (error instanceof AxiosError) {
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Erro ao criar conta.';
            console.error('Backend error message:', errorMessage);
            throw new ApiException(errorMessage);
        }
        throw new ApiException('Erro ao criar conta.')
    }
}

const logout = async (): Promise<void> => {
    await Api().post('/auth/logout');
}

const verify = async (): Promise<void> => {
    await Api().get('/auth/verify');
}

export const authService = { login, signup, logout, verify }
