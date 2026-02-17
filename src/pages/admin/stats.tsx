import { useEffect, useState } from "react";
import Logo from "../../assets/logo.png";

import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import UserService from "../../services/user/UserService";

interface IStatus {
    vets: number;
    bixes: number;
    approved: number;
    pending: number;
}

export const StatsPage = () => {

    const authCtx = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState<IStatus | undefined>(undefined);

    const loadStatus = async () => {
        setStatus(await UserService.getStats());
    }

    useEffect(() => {
        loadStatus();
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center gap-9 p-2 pt-8 bg-zinc-800 overflow-y-scroll">
            <div className="flex w-full justify-between">
                <button className="bg-blue-900 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer ml-2" onClick={() => navigate('/admin')}>← Admin</button>
                <button className="bg-amber-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer mr-2" onClick={() => authCtx.logout() }>Sair</button>
            </div>
            <img src={Logo} className="w-full lg:w-1/6 md:w-1/4 h-fit aspect-square" />
            <h1 className="text-4xl text-center font-extrabold text-cyan-200">Status:</h1>
            <div className="flex flex-wrap mx-8 items-center gap-2 text-white text-lg">
                <div className="flex flex-col flex-1/3 items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    <h1>Veteranes: </h1>  
                    {status?.vets}  
                </div>
                <div className="flex flex-col flex-1/3 items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    <h1>Bixes: </h1>  
                    {status?.bixes}
                </div>
                <div className="flex flex-col flex-1/4  items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    <h1>Total: </h1>  
                    {status && status?.bixes + status?.vets}
                </div>
                <div className="flex flex-col flex-1/3 items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    <h1>Veteranes Aprovades: </h1>  
                    {status?.approved}
                </div>
                <div className="flex flex-col flex-1/3 items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    <h1>Veteranes Pendentes: </h1>  
                    {status && status?.vets - status?.approved}
                </div>
                <div className="flex flex-col flex-1/4 items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    <h1>Cadastros Pendentes: </h1>  
                    {status?.pending}
                </div>
                
            </div>
        </div>
    )
}