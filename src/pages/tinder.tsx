import z from "zod";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { jwtDecode } from "jwt-decode";
import { Modal, Box, Typography, Chip, Divider, Button, IconButton } from "@mui/material";
import { CheckCircle, Close } from "@mui/icons-material";

import UserService, { IUserGet } from "../services/user/UserService";
import { useAuth } from "../hooks/useAuth";


export const TinderPage = () => {

    const authCtx = useAuth();
    const navigate = useNavigate();

    const [godparents, setGodparents] = useState<IUserGet[]>([]);
    const [selectedGodparent, setSelectedGodparent] = useState<IUserGet | null>(null);
    const [approvedGodparents, setApprovedGodparents] = useState<IUserGet[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    const handleOpenModal = (godparent: IUserGet) => {
        setSelectedGodparent(godparent);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedGodparent(null);
    };

    const handleToggleSelection = (godparent: IUserGet) => {
        setApprovedGodparents(prev => {
            const isSelected = prev.some(g => g.id === godparent.id);
            if (isSelected) {
                return prev.filter(g => g.id !== godparent.id);
            } else {
                return [...prev, godparent];
            }
        });
    };

    const handleSubmit = async () => {
        const min = (godparents.length < 5 ? godparents.length : 5);
        if (approvedGodparents.length < min) {
            toast.warn(`Selecione pelo menos ${min} padrinhes para continuar.`);
            return;
        }

        try {
            const uid = jwtDecode<{ id: string }>(authCtx.token!).id;
            z.string().uuid().parse(uid);

            await UserService.update(uid, { selectedGodparentsIds: approvedGodparents.map(g => g.id) });
            toast.success("Lista de padrinhes escolhida com sucesso!");
            navigate("/dashboard");
            // Should update the token, but works
            authCtx.status = true;
        } catch (_e) {
            toast.error("Erro ao salvar padrinhes selecionades.");
            return;
        }
    }

    const isGodparentSelected = (godparent: IUserGet) => {
        return approvedGodparents.some(g => g.id === godparent.id);
    };

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
        <div className="w-full h-full flex flex-col items-center gap-3 p-2 pt-5 bg-zinc-800 overflow-y-scroll pb-20">
            <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-3">
                {godparents.map(godparent => (
                    <div key={godparent.id}>
                        <div
                            className="flex flex-col items-center gap-2 bg-zinc-700 rounded-lg p-4 aspect-square w-full cursor-pointer hover:bg-zinc-600 transition-colors relative"
                            onClick={() => handleOpenModal(godparent)}
                        >
                            {isGodparentSelected(godparent) && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle sx={{ color: '#9ca3af', fontSize: '2rem' }} />
                                </div>
                            )}
                            <img src={godparent.whiteboard} className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm object-scale-down" />
                            <h1 className="text-lg sm:text-xl text-white font-bold text-center">{godparent.name}</h1>
                            <h2 className="text-sm sm:text-base text-gray-300 text-center">{godparent.course} - {godparent.yearOfEntry}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                open={modalOpen}
                onClose={handleCloseModal}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(128, 128, 128, 0.2)',
                }}
            >
                <Box sx={{
                    backgroundColor: '#27272a',
                    borderRadius: '0.75rem',
                    padding: '2rem',
                    width: 'min(90vw, 90vh)',
                    height: 'min(90vw, 90vh)',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    outline: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    '@media (max-width: 640px)': {
                        width: '92vw',
                        height: '88vh',
                        aspectRatio: 'auto',
                        padding: '1.5rem',
                    },
                }}>
                    <IconButton
                        aria-label="Fechar"
                        onClick={handleCloseModal}
                        sx={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            color: '#e5e7eb',
                        }}
                    >
                        <Close />
                    </IconButton>
                    {selectedGodparent && (
                        <div className="flex flex-col gap-4 h-full overflow-y-auto">
                            <img src={selectedGodparent.whiteboard} className="w-fit max-w-11/12 h-fit aspect-auto mx-auto" alt={selectedGodparent.name} />
                            <div className="flex items-center gap-4">
                                <div>
                                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                                        {selectedGodparent.name}
                                    </Typography>
                                </div>
                            </div>

                            <Divider sx={{ backgroundColor: '#52525b', width: '100%' }}/>

                            <div>
                                <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                                    Informações Básicas
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#d1d5db', mb: 0.5 }}>
                                    <strong>Curso:</strong> {selectedGodparent.course}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#d1d5db', mb: 0.5 }}>
                                    <strong>Ano de Entrada:</strong> {selectedGodparent.yearOfEntry}
                                </Typography>
                                {selectedGodparent.city && (
                                    <Typography variant="body2" sx={{ color: '#d1d5db', mb: 0.5 }}>
                                        <strong>Cidade:</strong> {selectedGodparent.city}
                                    </Typography>
                                )}
                            </div>

                            {selectedGodparent.pronouns && selectedGodparent.pronouns.length > 0 && (
                                <div>
                                    <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                                        Pronomes
                                    </Typography>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedGodparent.pronouns.map((pronoun, index) => (
                                            <Chip key={index} label={pronoun} sx={{ backgroundColor: '#3f3f46', color: 'white' }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedGodparent.lgbt && selectedGodparent.lgbt.length > 0 && (
                                <div>
                                    <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                                        LGBTQIAPN+
                                    </Typography>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedGodparent.lgbt.map((item, index) => (
                                            <Chip key={index} label={item} sx={{ backgroundColor: '#3f3f46', color: 'white' }} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Divider sx={{ backgroundColor: '#52525b', width: '100%' }} />

                            <div>
                                <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                                    Interesses
                                </Typography>
                                {selectedGodparent.hobby && (
                                    <Typography variant="body2" sx={{ color: '#d1d5db', mb: 0.5 }}>
                                        <strong>Hobbies:</strong> {selectedGodparent.hobby}
                                    </Typography>
                                )}
                                {selectedGodparent.music && (
                                    <Typography variant="body2" sx={{ color: '#d1d5db', mb: 0.5 }}>
                                        <strong>Música:</strong> {selectedGodparent.music}
                                    </Typography>
                                )}
                                {selectedGodparent.games && (
                                    <Typography variant="body2" sx={{ color: '#d1d5db', mb: 0.5 }}>
                                        <strong>Jogos:</strong> {selectedGodparent.games}
                                    </Typography>
                                )}
                                {selectedGodparent.sports && (
                                    <Typography variant="body2" sx={{ color: '#d1d5db', mb: 0.5 }}>
                                        <strong>Esportes:</strong> {selectedGodparent.sports}
                                    </Typography>
                                )}
                                <Typography variant="body2" sx={{ color: '#d1d5db', mb: 0.5 }}>
                                    <strong>Festas:</strong> {selectedGodparent.parties}/10
                                </Typography>
                            </div>

                            <Button
                                variant="contained"
                                onClick={() => handleToggleSelection(selectedGodparent)}
                                sx={{
                                    backgroundColor: isGodparentSelected(selectedGodparent) ? '#52525b' : '#3b82f6',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: isGodparentSelected(selectedGodparent) ? '#71717a' : '#2563eb',
                                    },
                                    marginTop: 'auto',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                }}
                            >
                                {isGodparentSelected(selectedGodparent) ? 'Desselecionar' : 'Selecionar'}
                            </Button>
                        </div>
                    )}
                </Box>
            </Modal>

            <button className={`absolute bottom-4 z-30 ${approvedGodparents.length < (godparents.length < 5 ? godparents.length : 5) ? "bg-zinc-700 hover:bg-zinc-600" : "bg-amber-600 hover:bg-amber-700 cursor-pointer"} text-white text-xl font-bold py-2 px-4 rounded-lg`} onClick={handleSubmit}>
                <Typography variant="h6" sx={{ color: '#d1d5db' }}>
                    {approvedGodparents.length} padrinhes selecionades  
                </Typography>
            </button>
        </div>
    )
}