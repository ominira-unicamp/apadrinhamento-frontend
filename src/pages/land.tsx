import { useNavigate } from "react-router-dom";

import Logo from "../assets/logo.png";

export const LandPage = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full h-full flex flex-col items-center gap-3 p-2 pt-5 bg-zinc-800 overflow-y-scroll">
            <img src={Logo} className="w-1/2 lg:w-1/6 md:w-1/4 h-fit aspect-square" />
            <h1 className="text-4xl text-center font-extrabold text-cyan-200">Bem-vinde ao Sistema de Apadrinhamento da INSERIR CURSO</h1>
            <p className="mt-8 text-xl max-w-3xl text-white text-center">Esse é um sistema criado pela Ominira, nele vocês serão separados em grupos de ingressantes e veteranes para conhecer como funciona a Unicamp e tirar todas as dúvidas!</p>
            <button className="mt-8 bg-amber-600 text-white text-xl font-bold py-2 px-4 rounded-lg cursor-pointer" onClick={() => navigate("/login")}>Começar</button>
        </div>
    )
}