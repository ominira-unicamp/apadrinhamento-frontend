import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Logo from "../assets/logo.png";
import { UnauthorizedException } from "../errors/UnauthorizedException";


interface ILogin {
    email: string,
    password: string
}

const loginSchema = z.object({
    email: z.string().regex(/^[a-zA-Z][0-9]{6}@dac.unicamp.br$/),
    password: z.string().min(8),
})

export const LoginPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<ILogin>({resolver: zodResolver(loginSchema), reValidateMode: "onBlur"});

    const authCtx = useAuth();
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        if (errors.email || errors.password) {
            return;
        }
        
        const pendingToast = toast.loading("Carregando...");

        try {
            await authCtx.login(data);
            toast.dismiss(pendingToast);
            navigate("/dashboard");
        } catch (e) {
            toast.dismiss(pendingToast);
            if (e instanceof UnauthorizedException) {
                return toast.error("Credenciais inválidas");
            }
            console.error(e);
            toast.error("Erro desconhecido ao fazer login");
            return;
        }
    }

    useEffect(() => {
        if (errors.email) {
            toast.error("Por favor insira um email da UNICAMP.");
        }
        
        if (errors.password) {
            toast.error("Por favor insira uma senha com pelo menos 8 caracteres.");
        }
    }, [errors]);

    useEffect(() => {
        authCtx.verify().then(() => navigate(authCtx.status ? "/dashboard" : "/login")).catch(() => {});
    }, []);
    
    return (
        <div className="w-full h-full flex flex-col items-center gap-5 p-2 pt-7 bg-zinc-800 overflow-y-scroll">
            <img src={Logo} className="w-1/2 lg:w-1/6 md:w-1/4 h-fit aspect-square" />
            <h1 className="text-4xl text-center font-extrabold text-cyan-200">Entre na sua conta</h1>
            <p className="mt-8 text-xl max-w-3xl text-rose-100 text-center">Use seu e-mail institucional e senha para acessar o sistema de apadrinhamento</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 w-5/6 lg:w-1/3 md:w-4/6 flex flex-col gap-3 bg-zinc-700 p-6 rounded-lg">
                <label htmlFor="email" className="text-lg text-white">E-mail:</label>
                <input type="email" id="email" className={`w-full border-1 border-${errors.email ? "red" : "gray"}-400 p-4 rounded-lg text-white`} {...register("email", {required: true})} />
                <label htmlFor="password" className="text-lg text-white">Senha:</label>
                <input type="password" className={`w-full border-1 border-${errors.password ? "red" : "gray"}-400 p-4 rounded-lg text-white`} {...register("password", {required: true})}/>
                <button className="mt-8 bg-amber-600 text-white text-xl font-bold py-2 px-4 rounded-lg cursor-pointer" type="submit">Entrar</button>
                <button 
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="mt-4 text-cyan-200 text-lg underline hover:text-cyan-300"
                >
                    Sem cadastro? Cadastre-se aqui
                </button>
            </form>
        </div>
    )
}