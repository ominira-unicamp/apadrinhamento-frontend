import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccountCircle from '@mui/icons-material/AccountCircle';

import Logo from "../../assets/logo.png";
import UserService, { IUserGet } from "../../services/user/UserService";
import { useAuth } from "../../hooks/useAuth";

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
    const nextUserIdRef = useRef<string | null>(null);

    const loadPendingApprovals = async () => {
        try {
            setUsers(await UserService.getPendingApprovals());
            
        } catch {
            toast.error("Erro ao carregar usuários pendentes de aprovação");
        }
    }

    const handleApprove = async (userId: string) => {
        try {
            await UserService.approveUser(userId);
            toast.success("Usuário aprovado com sucesso");
            
            // Find the user to remove and determine who to select next
            const currentIndex = users.findIndex(u => u.id === userId);
            nextUserIdRef.current = currentIndex > 0 
                ? users[currentIndex - 1].id  // Select previous user
                : (users.length > 1 ? users[1].id : null);  // Or next user if no previous
            
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        } catch {
            toast.error("Erro ao aprovar usuário");
        }
    };

    const handleReject = async (userId: string) => {
        try {
            await UserService.unapproveUser(userId);
            toast.success("Usuário rejeitado com sucesso");
            
            // Find the user to remove and determine who to select next
            const currentIndex = users.findIndex(u => u.id === userId);
            nextUserIdRef.current = currentIndex > 0 
                ? users[currentIndex - 1].id  // Select previous user
                : (users.length > 1 ? users[1].id : null);  // Or next user if no previous
            
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        } catch {
            toast.error("Erro ao rejeitar usuário");
        }
    };

    useEffect(() => {
        const approvals = users?.map(user => ({
            ...user,
            approve: () => handleApprove(user.id),
            reject: () => handleReject(user.id),
            next: undefined,
            previous: undefined,
        })) as IUserApproval[];
        
        for (let i = 0; i < approvals?.length; i++) {
            approvals[i].previous = i > 0 ? approvals[i - 1] : undefined;
            approvals[i].next = i < approvals.length - 1 ? approvals[i + 1] : undefined;
        }
        
        // Update selected user
        if (approvals?.length > 0) {
            // If we have a stored next user ID (from approve/reject), use it
            if (nextUserIdRef.current) {
                const nextUser = approvals.find(a => a.id === nextUserIdRef.current);
                if (nextUser) {
                    setSelectedUser(nextUser);
                    nextUserIdRef.current = null;
                    return;
                }
            }
            
            const currentStillExists = selectedUser && approvals.find(a => a.id === selectedUser.id);
            if (!currentStillExists) {
                // Current user was removed but no next ID stored, select first
                setSelectedUser(approvals[0]);
            } else {
                // Update the selected user with new next/previous references
                const updatedCurrent = approvals.find(a => a.id === selectedUser.id);
                setSelectedUser(updatedCurrent);
            }
        } else {
            setSelectedUser(undefined);
        }
    }, [users])

    useEffect(() => {
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