import { useEffect, useState } from "react";
import Logo from "../assets/logo.png";

import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import UserService from "../services/user/UserService";
import { jwtDecode } from "jwt-decode";

export const HomePage = () => {

    const authCtx = useAuth();
    const navigate = useNavigate();
    const [hasWhiteboard, setHasWhiteboard] = useState(false);
    const [hasSelectedGodparents, setHasSelectedGodparents] = useState(false);

    useEffect(() => {
        const checkUserData = async () => {
            try {
                const uid = jwtDecode<{ id: string }>(authCtx.token!).id;
                const userData = await UserService.get(uid);
                setHasWhiteboard(!!userData.whiteboard);
                setHasSelectedGodparents(!!(userData.selectedGodparents && userData.selectedGodparents.length > 0));
            } catch (error) {
                console.error("Error checking user data:", error);
            }
        };

        checkUserData();
    }, [authCtx.token]);


    return (
        <div className="w-full h-full flex flex-col items-center gap-9 p-2 pt-8 bg-zinc-800 overflow-y-scroll">
            <div className="flex w-full justify-between">
                <div className="flex gap-2">
                    <button className="bg-blue-900 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer" onClick={() => navigate('/signup', { state: { edit: true } }) }>Editar Respostas</button>
                    {hasWhiteboard && (
                        <button className="bg-cyan-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer" onClick={() => navigate('/whiteboard') }>Ver/Editar Montagem</button>
                    )}
                    {authCtx.role === 'bixe' && hasSelectedGodparents && (
                        <button className="bg-purple-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer" onClick={() => navigate('/tinder') }>Ver/Editar Padrinhes</button>
                    )}
                </div>
                <button className="bg-amber-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer mr-2" onClick={() => authCtx.logout() }>Sair</button>
            </div>
            <img src={Logo} className="w-full lg:w-1/6 md:w-1/4 h-fit aspect-square" />
            <h1 className="text-4xl text-center font-extrabold text-cyan-200">Obrigado por Participar!</h1>
            <button disabled className="mt-8 bg-amber-600 text-white text-xl font-bold py-2 px-4 rounded-lg not-disabled:cursor-pointer disabled:bg-gray-500" onClick={() => navigate('/results') }>RESULTADO</button>
            
            {authCtx.role === "ADMIN" && (
                <button 
                    className="mt-4 bg-blue-900 text-white text-xl font-bold py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-950" 
                    onClick={() => navigate('/admin')}
                >
                    Painel Administrativo
                </button>
            )}
        </div>
    )
}
