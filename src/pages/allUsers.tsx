import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Logo from "../assets/logo.png";
import UserService, { IUserGet } from "../services/user/UserService";

export const AllUsersPage = () => {
    const authCtx = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<IUserGet[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "approved" | "pending" | "rejected" | "bixes">("all");

    useEffect(() => {
        if (authCtx.role !== "ADMIN") {
            navigate("/dashboard");
            return;
        }

        loadUsers();
    }, [authCtx.role, navigate]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await UserService.getAllUsers();
            setUsers(data);
        } catch (error) {
            toast.error("Erro ao carregar usuários");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnapprove = async (userId: string, userName: string) => {
        if (!window.confirm(`Tem certeza que deseja rejeitar ${userName}?`)) {
            return;
        }

        try {
            await UserService.unapproveUser(userId);
            toast.success(`${userName} foi rejeitado com sucesso`);
            loadUsers();
        } catch (error) {
            toast.error("Erro ao rejeitar usuário");
            console.error(error);
        }
    };

    const handleApprove = async (userId: string, userName: string) => {
        if (!window.confirm(`Tem certeza que deseja aprovar ${userName}?`)) {
            return;
        }

        try {
            await UserService.approveUser(userId);
            toast.success(`${userName} foi aprovado com sucesso`);
            loadUsers();
        } catch (error) {
            toast.error("Erro ao aprovar usuário");
            console.error(error);
        }
    };

    const filteredUsers = users.filter(user => {
        if (filter === "approved") return user.approved && user.role === "veterane";
        if (filter === "pending") return !user.approved && !user.rejected && user.role === "veterane";
        if (filter === "rejected") return user.rejected && user.role === "veterane";
        if (filter === "bixes") return user.role === "bixe";
        return true;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTelephone = (telephone?: string) => {
        if (!telephone) return "Não informado";
        const digits = telephone.replace(/\D/g, '');
        if (digits.length === 11) {
            return `(${digits.slice(0, 2)})${digits.slice(2, 3)}${digits.slice(3, 7)}-${digits.slice(7)}`;
        }
        return telephone;
    };

    return (
        <div className="w-full h-full flex flex-col items-center gap-9 p-2 pt-8 bg-zinc-800 overflow-y-scroll">
            <div className="flex w-full justify-between">
                <button 
                    className="bg-blue-900 rounded-lg px-3 text-white font-bold text-xl cursor-pointer ml-2" 
                    onClick={() => navigate('/admin')}
                >
                    ← Admin
                </button>
                <button 
                    className="bg-amber-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer mr-2" 
                    onClick={() => authCtx.logout()}
                >
                    Sair
                </button>
            </div>

            <img src={Logo} className="w-1/2 lg:w-1/6 md:w-1/4 h-fit aspect-square" />
            
            <h1 className="text-4xl text-center font-extrabold text-cyan-200">
                Todos os Usuários
            </h1>

            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded-lg font-bold ${
                        filter === "all" 
                            ? "bg-cyan-600 text-white" 
                            : "bg-zinc-700 text-white hover:bg-zinc-600"
                    }`}
                >
                    Todos ({users.length})
                </button>
                <button
                    onClick={() => setFilter("approved")}
                    className={`px-4 py-2 rounded-lg font-bold ${
                        filter === "approved" 
                            ? "bg-green-600 text-white" 
                            : "bg-zinc-700 text-white hover:bg-zinc-600"
                    }`}
                >
                    Aprovados ({users.filter(u => u.approved && u.role === "veterane").length})
                </button>
                <button
                    onClick={() => setFilter("pending")}
                    className={`px-4 py-2 rounded-lg font-bold ${
                        filter === "pending" 
                            ? "bg-orange-600 text-white" 
                            : "bg-zinc-700 text-white hover:bg-zinc-600"
                    }`}
                >
                    Pendentes ({users.filter(u => !u.approved && !u.rejected && u.role === "veterane").length})
                </button>
                <button
                    onClick={() => setFilter("rejected")}
                    className={`px-4 py-2 rounded-lg font-bold ${
                        filter === "rejected" 
                            ? "bg-red-600 text-white" 
                            : "bg-zinc-700 text-white hover:bg-zinc-600"
                    }`}
                >
                    Rejeitados ({users.filter(u => u.rejected && u.role === "veterane").length})
                </button>
                <button
                    onClick={() => setFilter("bixes")}
                    className={`px-4 py-2 rounded-lg font-bold ${
                        filter === "bixes" 
                            ? "bg-blue-600 text-white" 
                            : "bg-zinc-700 text-white hover:bg-zinc-600"
                    }`}
                >
                    Bixes ({users.filter(u => u.role === "bixe").length})
                </button>
            </div>

            {loading ? (
                <p className="text-white text-xl">Carregando...</p>
            ) : (
                <div className="w-full max-w-6xl px-4">
                    <div className="grid gap-4">
                        {filteredUsers.map((user) => (
                            <div 
                                key={user.id}
                                className="bg-zinc-700 rounded-lg p-6 text-white"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-xl font-bold">{user.name}</h2>
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                user.role === "bixe" 
                                                    ? "bg-blue-600" 
                                                    : user.rejected
                                                        ? "bg-red-600"
                                                        : user.approved 
                                                            ? "bg-green-600" 
                                                            : "bg-orange-600"
                                            }`}>
                                                {user.role === "bixe" 
                                                    ? "Bixe" 
                                                    : user.rejected
                                                        ? "Veterane Rejeitado"
                                                        : user.approved 
                                                            ? "Veterane Aprovado" 
                                                            : "Veterane Pendente"}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                                            <p><span className="text-cyan-400">Email:</span> {user.email}</p>
                                            <p><span className="text-cyan-400">Curso:</span> {user.course}</p>
                                            <p><span className="text-cyan-400">Telefone:</span> {formatTelephone(user.telephone)}</p>
                                            <p><span className="text-cyan-400">Ano de Ingresso:</span> {user.yearOfEntry || "Não informado"}</p>
                                            <p><span className="text-cyan-400">Cadastrado em:</span> {user.createdAt ? formatDate(user.createdAt) : "Não disponível"}</p>
                                            <p><span className="text-cyan-400">Perfil Completo:</span> {user.status ? "Sim" : "Não"}</p>
                                        </div>
                                    </div>

                                    {user.role === "veterane" && (
                                        <>
                                            {user.approved && (
                                                <button
                                                    onClick={() => handleUnapprove(user.id, user.name)}
                                                    className="ml-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                                >
                                                    Rejeitar
                                                </button>
                                            )}
                                            {user.rejected && (
                                                <button
                                                    onClick={() => handleApprove(user.id, user.name)}
                                                    className="ml-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                                >
                                                    Aprovar
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredUsers.length === 0 && (
                        <p className="text-white text-center text-xl mt-8">
                            Nenhum usuário encontrado com este filtro.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
