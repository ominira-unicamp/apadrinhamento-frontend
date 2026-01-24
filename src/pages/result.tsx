import { useEffect, useState } from "react";
import Logo from "../assets/logo.png";

import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import UserService, { IUserGet } from "../services/user/UserService";
import { jwtDecode } from "jwt-decode";
import { Slider } from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";

export const ResultPage = () => {

    const authCtx = useAuth();
    const navigate = useNavigate();

    const [user, setUser] = useState<IUserGet>();

    const load = async () => {
        setUser(await UserService.get(jwtDecode<{id: string}>(authCtx.token).id));
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center gap-9 p-2 pt-8 bg-zinc-800 overflow-y-scroll">
            <div className="flex w-full justify-between">
                <button 
                    className="bg-blue-900 rounded-lg px-3 text-white font-bold text-xl cursor-pointer ml-2" 
                    onClick={() => navigate('/dashboard')}
                >
                    ← Voltar
                </button>
                <button className="bg-amber-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer mr-2" onClick={() => authCtx.logout() }>Sair</button>
            </div>
            <img src={Logo} className="w-1/2 lg:w-1/6 md:w-1/4 h-fit aspect-square" />
            <h1 className="text-4xl text-center font-extrabold text-cyan-200">{authCtx?.role == 'bixe' ? 'Você foi apadrinhade por:' : 'Você apadrinhou:'}</h1>
            {user && user.godchildRelation?.map((relation) => {
                return (
                    <div key={relation.godparent.id} className="flex flex-col w-full lg:w-4/5 lg:2/3 gap-2 bg-zinc-700 rounded-lg p-8 text-white gap-y-6">
                        <div className="flex items-center gap-2 ml-2">
                            {relation.godparent.picture ?
                                (<img src={relation.godparent.picture} className="w-1/4 h-full object-cover aspect-square rounded-md" />) 
                                :
                                (<div className="text-5xl lg:text-9xl"><AccountCircle fontSize="inherit" className="text-white" /></div>)
                            }
                            <div className="flex flex-col">
                                <p><b>Nome:</b> {relation.godparent.name}</p>
                                <p><b>Email:</b> {relation.godparent.email}</p>
                                <p><b>Veio de:</b> {relation.godparent.city}</p>
                            </div>
                        </div>
                        <div className='w-5/6'>
                            <Slider aria-label="Festas"
                                min={0}
                                max={10}
                                value={relation.godparent.parties}
                                sx={{ color: "#a2f4fd" }}
                            />
                            <div className="flex justify-between">
                                <p>Pouco</p>
                                <p>Muito</p>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold">O que você mais gosta de fazer?</h1>
                            <p>{relation.godparent.hobby}</p>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold">Qual gênero musical ou artista que te define?</h1>
                            <p>{relation.godparent.music}</p>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold">Gosta de videogames? Se sim, quais?</h1>
                            <p>{relation.godparent.games}</p>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold">Gosta de esportes? Se sim, quais?</h1>
                            <p>{relation.godparent.sports}</p>
                        </div>
                    </div>
                )
            }
            )}
            {user && user.godparentRelation?.map((relation) => {
                return (
                    <div key={relation.godchild.id} className="flex flex-col w-full lg:w-4/5 lg:2/3 gap-2 bg-zinc-700 rounded-lg p-8 text-white gap-y-6">
                        <div className="flex items-center gap-2 ml-2">
                            {relation.godchild.picture ?
                                (<img src={relation.godchild.picture} className="w-1/4 h-full object-cover aspect-square rounded-md" />) 
                                :
                                (<div className="text-5xl lg:text-9xl"><AccountCircle fontSize="inherit" className="text-white" /></div>)
                            }
                            <div className="flex flex-col">
                                <p><b>Nome:</b> {relation.godchild.name}</p>
                                <p><b>Email:</b> {relation.godchild.email}</p>
                                <p><b>Veio de:</b> {relation.godchild.city}</p>
                            </div>
                        </div>
                        <div className='w-5/6'>
                            <Slider aria-label="Festas"
                                min={0}
                                max={10}
                                value={relation.godchild.parties}
                                sx={{ color: "#a2f4fd" }}
                            />
                            <div className="flex justify-between">
                                <p>Pouco</p>
                                <p>Muito</p>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold">O que você mais gosta de fazer?</h1>
                            <p>{relation.godchild.hobby}</p>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold">Qual gênero musical ou artista que te define?</h1>
                            <p>{relation.godchild.music}</p>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold">Gosta de videogames? Se sim, quais?</h1>
                            <p>{relation.godchild.games}</p>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold">Gosta de esportes? Se sim, quais?</h1>
                            <p>{relation.godchild.sports}</p>
                        </div>
                    </div>
                )
            }
            )}
        </div>
    )
}
