import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import CopyAllIcon from '@mui/icons-material/CopyAll';

import Logo from "../../assets/logo.png";
import { useAuth } from "../../hooks/useAuth";
import UserService from "../../services/user/UserService";


export const GodparentingPage = () => {

    const authCtx = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, setValue } = useForm();

    const [available, setAvailable] = useState<string>('undefined');
    const [isRunningMatch, setIsRunningMatch] = useState(false);

    const loadAvailableToMatch = async () => {
        setAvailable(await UserService.getToMatch());
    }

    useEffect(() => {
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

    const handleRunMatching = async () => {
        if (!window.confirm("Tem certeza que deseja executar o algoritmo de apadrinhamento? Isso pode levar alguns minutos.")) {
            return;
        }

        try {
            setIsRunningMatch(true);
            toast.info("Executando algoritmo de apadrinhamento...");
            const result = await UserService.runMatching();
            setValue("data", JSON.stringify(result, null, 2));
            toast.success("Algoritmo executado com sucesso! Resultado colocado no campo abaixo.");
        } catch (error) {
            toast.error("Erro ao executar algoritmo de apadrinhamento");
            console.error(error);
        } finally {
            setIsRunningMatch(false);
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
                <div className="flex flex-col flex-1/4 items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    <button 
                        onClick={handleRunMatching} 
                        disabled={isRunningMatch}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 rounded-lg px-4 py-2 text-white font-bold text-lg cursor-pointer disabled:cursor-not-allowed transition-colors w-full"
                    >
                        {isRunningMatch ? "Executando..." : "Executar Algoritmo Automaticamente"}
                    </button>
                    <p className="text-sm text-center text-gray-300">
                        Clique acima para executar o algoritmo de apadrinhamento automaticamente. O resultado será preenchido no campo abaixo.
                    </p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1/4 items-center gap-2 bg-zinc-700 rounded-lg p-4">
                    <textarea {...register('data')} placeholder="JSON do apadrinhamento" className="bg-zinc-800 text-white p-2 rounded-lg h-40 w-full font-mono text-sm" />
                    <button type="submit" className="bg-amber-600 hover:bg-amber-700 rounded-lg px-3 py-2 text-white font-bold text-lg cursor-pointer transition-colors w-full">Enviar (NÃO CLIQUE SE NÃO TIVER CERTEZA)</button>
                </form>
                
            </div>
        </div>
    )
}