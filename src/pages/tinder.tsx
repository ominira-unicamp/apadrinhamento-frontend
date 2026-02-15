import { useEffect, useState } from "react";
import Logo from "../assets/logo.png";
import { toast } from "react-toastify";

import UserService, { IUserGet } from "../services/user/UserService";
import { Grid2, Modal, Box, Typography, Chip, Divider, Button } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";


export const TinderPage = () => {

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
        <div className="w-full h-full flex flex-col items-center gap-3 p-2 pt-5 bg-zinc-800 overflow-y-scroll">
            <Grid2 container spacing={2} className="w-full max-w-4xl">
                {godparents.map(godparent => (
                    <Grid2 key={godparent.id}>
                        <div 
                            className="flex flex-col items-center gap-2 bg-zinc-700 rounded-lg p-4 aspect-square w-50 cursor-pointer hover:bg-zinc-600 transition-colors relative"
                            onClick={() => handleOpenModal(godparent)}
                        >
                            {isGodparentSelected(godparent) && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle sx={{ color: '#9ca3af', fontSize: '2rem' }} />
                                </div>
                            )}
                            <img src={Logo} className="w-24 h-24 rounded-full" />
                            <h1 className="text-xl text-white font-bold">{godparent.name}</h1>
                            <h2 className="text-md text-gray-300">{godparent.course} - {godparent.yearOfEntry}</h2>
                        </div>
                    </Grid2>
                ))}
            </Grid2>

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
                    width: 'min(80vw, 80vh)',
                    height: 'min(80vw, 80vh)',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    outline: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}>
                    {selectedGodparent && (
                        <div className="flex flex-col gap-4 h-full overflow-y-auto">
                            <img src={Logo} className="w-20 h-20 rounded-full mx-auto" alt={selectedGodparent.name} />
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
    
        </div>
    )
}