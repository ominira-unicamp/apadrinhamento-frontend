import { useEffect, useState } from "react";
import Logo from "../assets/logo.png";
import { toast } from "react-toastify";

import UserService, { IUserGet } from "../services/user/UserService";
import { Grid2 } from "@mui/material";


export const TinderPage = () => {

    const [godparents, setGodparents] = useState<IUserGet[]>([]);

    const loadGodparents = async () => {
        try {
            setGodparents(await UserService.getGodparents());
        } catch (_e) {
            toast.error("Erro ao carregar padrinhes");
        }
    }

    useEffect(() => {
        loadGodparents();
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center gap-3 p-2 pt-5 bg-zinc-800 overflow-y-scroll">
            <Grid2 container spacing={2} className="w-full max-w-4xl">
                {godparents.map(godparent => (
                    <Grid2 key={godparent.id}>
                        <div className="flex flex-col items-center gap-2 bg-zinc-700 rounded-lg p-4">
                            <img src={Logo} className="w-24 h-24 rounded-full" />
                            <h1 className="text-xl text-white font-bold">{godparent.name}</h1>
                            <p className="text-sm text-gray-300">{godparent.email}</p>
                        </div>
                    </Grid2>
                ))}
            </Grid2>
    
        </div>
    )
}