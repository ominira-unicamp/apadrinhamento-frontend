import { useEffect } from "react";
import Logo from "../assets/logo.png";

import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const HomePage = () => {

    const authCtx = useAuth();
    const navigate = useNavigate();
    

    return (
        <div className="w-full h-full flex flex-col items-center gap-9 p-2 pt-8 bg-zinc-800 overflow-y-scroll">
            <div className="flex w-full justify-between">
                <button className="bg-blue-900 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer mr-2" onClick={() => navigate('/signup', { state: { edit: true } }) }>Editar Respostas</button>
                <button className="bg-amber-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer mr-2" onClick={() => authCtx.logout() }>Sair</button>
            </div>
            <img src={Logo} className="w-full lg:w-1/6 md:w-1/4 h-fit aspect-square" />
            <h1 className="text-4xl text-center font-extrabold text-cyan-200">Obrigado por Participar!</h1>
            <p className="mt-8 text-xl max-w-3xl text-white text-center">Fique antenade em <a href="https://www.instagram.com/ctcomp025/" target="_blank" className="text-amber-600">nosso instagram</a>, para quando sair o resultado!</p>
            <button className="mt-8 bg-amber-600 text-white text-xl font-bold py-2 px-4 rounded-lg not-disabled:cursor-pointer disabled:bg-gray-500" onClick={() => navigate('/results') }>RESULTADO</button>
        </div>
    )
}
