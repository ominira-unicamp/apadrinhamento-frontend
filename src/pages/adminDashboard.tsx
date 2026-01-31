import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Logo from "../assets/logo.png";

export const AdminDashboardPage = () => {
  const authCtx = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authCtx.role !== "ADMIN") {
      navigate("/dashboard");
    }
  }, [authCtx.role, navigate]);

  const adminPages = [
    {
      title: "Aprovação de Usuários",
      description: "Aprovar ou rejeitar novos cadastros",
      path: "/admin/approval",
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "Todos os Usuários",
      description: "Ver todos os usuários cadastrados e gerenciar aprovações",
      path: "/admin/users",
      color: "bg-cyan-600 hover:bg-cyan-700"
    },
    {
      title: "Estatísticas",
      description: "Ver estatísticas gerais do sistema",
      path: "/admin/stats",
      color: "bg-blue-900 hover:bg-blue-700"
    },
    {
      title: "Gerenciar Apadrinhamento",
      description: "Gerenciar e criar relações de apadrinhamento",
      path: "/admin/godparenting",
      color: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  return (
    <div className="w-full h-full flex flex-col items-center gap-9 p-2 pt-8 bg-zinc-800 overflow-y-scroll">
      <div className="flex w-full justify-end">
        <button
          className="bg-amber-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer mr-2"
          onClick={() => authCtx.logout()}
        >
          Sair
        </button>
      </div>

      <img src={Logo} className="w-1/2 lg:w-1/6 md:w-1/4 h-fit aspect-square" />
      
      <h1 className="text-4xl text-center font-extrabold text-cyan-200">
        Painel Administrativo
      </h1>
      
      <p className="text-xl text-white text-center">
        Bem-vindo(a), <span className="text-amber-600">{authCtx.name}</span>
      </p>

      <div className="w-full max-w-1xl grid grid-cols-1 md:grid-cols-4 gap-6 mt-7 px-3">
        {adminPages.map((page) => (
          <button
            key={page.path}
            onClick={() => navigate(page.path)}
            className={`${page.color} text-white rounded-lg p-6 flex flex-col items-center justify-center gap-4 transition-all duration-200 transform hover:scale-105 shadow-lg aspect-square`}
          >
            <h2 className="text-xl font-bold text-center">{page.title}</h2>
            <p className="text-sm text-center opacity-90">{page.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-zinc-700 text-white px-6 py-3 rounded-lg hover:bg-zinc-600 transition-colors"
        >
          ← Voltar para Dashboard de Usuário
        </button>
      </div>
    </div>
  );
};
