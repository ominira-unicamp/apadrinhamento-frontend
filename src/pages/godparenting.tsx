import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Logo from "../assets/logo.png";
import CopyAllIcon from '@mui/icons-material/CopyAll';

import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import UserService from "../services/user/UserService";
import { toast } from "react-toastify";


export const GodparentingPage = () => {

    const authCtx = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit } = useForm();

    const [available, setAvailable] = useState<string>('undefined');

    const loadAvailableToMatch = async () => {
        setAvailable(await UserService.getToMatch());
    }

    useEffect(() => {
        if (!authCtx.status && authCtx.role !== "ADMIN") {
            console.log(authCtx);
            navigate('/signup');
            return;
        }

        loadAvailableToMatch();
    }, []);

    const onSubmit = async (data: any) => {
        try {
            await UserService.addGodparentRelations(JSON.parse(data.data));
            toast.success("Apadrinhamento adicionado com sucesso");
        } catch (e) {
            toast.error("Erro ao adicionar apadrinhamento");
            console.error(e);
        }
    }

    return (
        <div className="w-full h-full flex flex-col items-center gap-9 p-2 pt-8 bg-zinc-800 overflow-y-scroll">
            <div className="flex w-full justify-between">
                <button className="bg-blue-900 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer ml-2" onClick={() => navigate('/admin')}>← Admin</button>
                <button className="bg-amber-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer mr-2" onClick={() => authCtx.logout() }>Sair</button>
            </div>
            <img src={Logo} className="w-full lg:w-1/6 md:w-1/4 h-fit aspect-square" />
            <h1 className="text-4xl text-center font-extrabold text-cyan-200">Apadrinhamento:</h1>
            <div className="flex flex-wrap mx-8 gap-2 text-white text-lg">
                <div className="flex flex-col flex-1/3 items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    {available === '' ? <h1>Carregando...</h1> : 
                    <>
                        <div onClick={() => {navigator.clipboard.writeText(available); toast.success("Copiado para o clipboard!")}} className=" rounded-lg px-3 text-white font-bold text-xl cursor-pointer">
                            <CopyAllIcon />
                        </div>
                        <h1>Disponíveis para apadrinhamento: {available}</h1>
                    </>
                    }
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1/4 items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    <input type="text" {...register('data')} placeholder="JSON do apadrinhamento" className="bg-zinc-800 text-white p-2 rounded-lg h-full w-full" />
                    <button type="submit" className="bg-amber-600 rounded-lg px-3 text-white font-bold text-xl cursor-pointer">Enviar (NÃO CLIQUE SE NÃO TIVER CERTEZA)</button>
                </form>
                
            </div>
        </div>
    )
}