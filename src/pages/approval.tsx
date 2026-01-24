import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccountCircle from '@mui/icons-material/AccountCircle';

import Logo from "../assets/logo.png";
import UserService, { IUserGet } from "../services/user/UserService";

interface IUserApproval extends IUserGet {
    next: IUserApproval | undefined;
    previous: IUserApproval | undefined;
    approve: () => void;
    reject: () => void;
}

export const ApprovalPage = () => {

    const authCtx = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<IUserGet[]>([]);
    const [selectedUser, setSelectedUser] = useState<IUserApproval | undefined>(undefined);

    const loadPendingApprovals = async () => {
        try {
            setUsers(await UserService.getPendingApprovals());
            
        } catch {
            toast.error("Erro ao carregar usuários pendentes de aprovação");
        }
    }

    useEffect(() => {
        const approvals = users?.map(user => ({
            ...user,
            approve: async () => {
                try {
                    await UserService.approveUser(user.id);
                    setUsers(users.filter(u => u.id !== user.id));
                } catch {
                    toast.error("Erro ao aprovar usuário");
                }
            },
            reject: async () => {
                try {
                    setUsers(users.filter(u => u.id !== user.id));
                } catch {
                    toast.error("Erro ao rejeitar usuário");
                }
            },
            next: undefined,
            previous: undefined,
        })) as IUserApproval[];
        
        for (let i = 0; i < approvals?.length; i++) {
            approvals[i].previous = i > 0 ? approvals[i - 1] : undefined;
            approvals[i].next = i < approvals.length - 1 ? approvals[i + 1] : undefined;
        }
        
        if (approvals?.length > 0) {
            setSelectedUser(approvals[0]);
        }
    }, [users])

    useEffect(() => {
        if (authCtx.role !== "ADMIN") {
            navigate('/login');
            return;
        }

        loadPendingApprovals();
    }, []);



    return (
        <div className="w-full h-full flex flex-col items-center gap-9 p-2 pt-8 bg-zinc-800 overflow-y-scroll">
            <div className="flex w-full justify-between">
                <button className="bg-blue-900 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer ml-2" onClick={() => navigate('/admin')}>← Admin</button>
                <button className="bg-amber-600 rounded-lg px-3 text-white font-bold text-xl self-end cursor-pointer mr-2" onClick={() => authCtx.logout() }>Sair</button>
            </div>
            <img src={Logo} className="w-1/5 lg:w-1/6 md:w-1/4 h-fit aspect-square" />
            {selectedUser &&
            <>  
                <div className="w-5/6 lg:w-2/6 flex flex-col items-center gap-6 bg-zinc-700 py-8 rounded-lg">
                    <div className="w-full flex justify-between text-[10rem]">
                        <div className={"items-center flex h-full " + (selectedUser.previous ? "cursor-pointer text-amber-600" : "text-white")} onClick={() => { if(selectedUser.previous) setSelectedUser(selectedUser.previous ?? undefined)}}>
                            <ChevronLeftIcon fontSize="inherit"/>
                        </div>
                        {selectedUser.picture != null ? 
                            (<img src={selectedUser.picture} className="w-full h-full object-cover aspect-square rounded-full" />) 
                            :
                            (<AccountCircle fontSize="inherit" className="text-white" />)
                        }
                        <div className={"items-center flex h-full " + (selectedUser.next ? "cursor-pointer text-amber-600" : "text-white")} onClick={() => { if(selectedUser.next) setSelectedUser(selectedUser.next ?? undefined)}}>
                            <ChevronRightIcon fontSize="inherit"/>
                        </div>
                    </div>
                    <div className="w-full flex flex-col items-center gap-y-1 text-white">
                        <div className="text-xl"><b>Nome:</b> {selectedUser.name}</div>
                        <div className="text-lg"><b>Curso:</b> {selectedUser.course}</div>
                        <div className="text-lg"><b>Email:</b> {selectedUser.email}</div>
                        <div className="text-lg">
                            <b>Telefone:</b> {selectedUser.telephone ? selectedUser.telephone.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1)$2$3-$4') : 'Não informado'}
                        </div>
                        <div className="text-lg">
                            <b>Ano de Ingresso:</b> {selectedUser.yearOfEntry || 'Não informado'}
                        </div>
                    </div>
                    <div className="w-full flex justify-evenly">
                        <button className="bg-cyan-600 rounded-lg p-3 text-white font-bold text-lg self-end cursor-pointer mr-2" onClick={selectedUser.reject}>Rejeitar</button>
                        <button className="bg-amber-600 rounded-lg p-3 text-white font-bold text-lg self-end cursor-pointer mr-2" onClick={selectedUser.approve}>Aprovar</button>
                    </div>
                </div>
            </>
            }
        </div>
    )
}