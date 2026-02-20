import { IconButton, Tooltip, Modal, Box } from "@mui/material";
import { CloudUpload, Delete, ZoomIn, ZoomOut, Home, CheckCircle, Undo, Redo, ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, DeleteSweep } from "@mui/icons-material";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";

import { useAuth } from "../hooks/useAuth";
import UserService from "../services/user/UserService";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

type ImageData = {
    image: HTMLImageElement;
    x: number;
    y: number;
    width?: number;
    height?: number;
};

const CANVAS_WIDTH = 1500;
const CANVAS_HEIGHT = 800;

export const WhiteboardPage = () => {
    const [images, setImages] = useState<ImageData[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const [isMobilePanningEnabled, setIsMobilePanningEnabled] = useState(false);
    const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
    const [finalizedImageUrl, setFinalizedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasExistingWhiteboard, setHasExistingWhiteboard] = useState(false);
    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const historyRef = useRef<ImageData[][]>([[]]);
    const historyStepRef = useRef(0);
    const imagesRef = useRef<ImageData[]>([]);
    const historyDirtyRef = useRef(false);
    const finalizeRef = useRef(false);

    const authCtx = useAuth();
    const navigate = useNavigate();

    // Debug modal state
    useEffect(() => {
        console.log("Modal state changed:", finalizeModalOpen);
    }, [finalizeModalOpen]);

    // Load existing whiteboard on mount
    useEffect(() => {
        const loadExistingWhiteboard = async () => {
            try {
                const uid = jwtDecode<{ id: string }>(authCtx.token!).id;
                const userData = await UserService.get(uid);
                
                if (userData.whiteboard) {
                    setHasExistingWhiteboard(true);
                    const img = new Image();
                    img.onload = () => {
                        setImages([{
                            image: img,
                            x: 0,
                            y: 0,
                            width: CANVAS_WIDTH,
                            height: CANVAS_HEIGHT,
                        }]);
                        pushHistory([{
                            image: img,
                            x: 0,
                            y: 0,
                            width: CANVAS_WIDTH,
                            height: CANVAS_HEIGHT,
                        }]);
                        toast.info("Whiteboard anterior carregado. Você pode editá-lo ou criar um novo.");
                    };
                    img.crossOrigin = "Anonymous";
                    img.src = userData.whiteboard;
                }
            } catch (error) {
                console.error("Error loading existing whiteboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadExistingWhiteboard();
    }, [authCtx.token]);

    const pushHistory = (nextImages: ImageData[]) => {
        let nextHistory = historyRef.current.slice(0, historyStepRef.current + 1);
        nextHistory = nextHistory.concat([nextImages]);

        if (nextHistory.length > 8) {
            const overflow = nextHistory.length - 8;
            nextHistory = nextHistory.slice(overflow);
        }

        historyRef.current = nextHistory;
        historyStepRef.current = nextHistory.length - 1;
    };

    const commitHistoryIfDirty = () => {
        if (!historyDirtyRef.current) return;
        pushHistory(imagesRef.current);
        historyDirtyRef.current = false;
    };

    const handleUndo = () => {
        if (historyStepRef.current === 0) return;
        historyStepRef.current -= 1;
        const previous = historyRef.current[historyStepRef.current];
        setImages(previous);
        historyDirtyRef.current = false;
    };

    const handleRedo = () => {
        if (historyStepRef.current === historyRef.current.length - 1) return;
        historyStepRef.current += 1;
        const next = historyRef.current[historyStepRef.current];
        setImages(next);
        historyDirtyRef.current = false;
    };

    const deleteSelected = () => {
        if (selectedIdx === null) return;
        setImages((prev) => {
            const next = prev.filter((_, i) => i !== selectedIdx);
            pushHistory(next);
            return next;
        });
        setSelectedIdx(null);
        historyDirtyRef.current = false;
    };

    const clearAll = () => {
        if (images.length === 0) return;
        if (window.confirm("Tem certeza que deseja limpar todo o canvas? Esta ação não pode ser desfeita além do histórico salvo.")) {
            setImages([]);
            pushHistory([]);
            setSelectedIdx(null);
            historyDirtyRef.current = false;
            toast.info("Canvas limpo!");
        }
    };

    useEffect(() => {
        if (selectedIdx !== null && transformerRef.current) {
            const stage = stageRef.current?.getStage();
            const layer = stage?.getLayers()[0];
            const image = layer?.getChildren()[selectedIdx];
            transformerRef.current.nodes([image]);
        }
    }, [selectedIdx]);

    useEffect(() => {
        imagesRef.current = images;
    }, [images]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Delete") deleteSelected();
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) {
                        processImages([file]);
                        toast.success("Imagem colada com sucesso!");
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("paste", handlePaste);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("paste", handlePaste);
        };
    }, [selectedIdx]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(pointer: coarse)");

        const updatePanning = () => setIsMobilePanningEnabled(mediaQuery.matches);
        updatePanning();

        mediaQuery.addEventListener("change", updatePanning);
        return () => mediaQuery.removeEventListener("change", updatePanning);
    }, []);

    useEffect(() => {
        if (finalizeRef.current && selectedIdx === null) {
            finalizeRef.current = false;
            const stage = stageRef.current?.getStage();
            if (stage) {
                const url = stage.toDataURL({ mimeType: "image/webp", quality: 0.8 });
                console.log("Setting finalized image URL:", url ? "Generated" : "Failed");
                setFinalizedImageUrl(url);
                setFinalizeModalOpen(true);
                console.log("Modal should be opening now");
            }
        }
    }, [selectedIdx]);

    const clampStagePosition = (position: { x: number; y: number }, scale: number) => {
        const stage = stageRef.current?.getStage();
        if (!stage) return position;

        const container = stage.getContainer();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const maxX = 0;
        const minX = containerWidth - CANVAS_WIDTH * scale;
        const maxY = 0;
        const minY = containerHeight - CANVAS_HEIGHT * scale;

        return {
            x: Math.max(Math.min(position.x, maxX), minX),
            y: Math.max(Math.min(position.y, maxY), minY),
        };
    };

    const panStageBy = (deltaX: number, deltaY: number) => {
        const stage = stageRef.current?.getStage();
        if (!stage) return;

        const nextPos = {
            x: stage.x() + deltaX,
            y: stage.y() + deltaY,
        };

        const clampedPos = clampStagePosition(nextPos, zoom);
        stage.position(clampedPos);
        stage.batchDraw();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer?.files || []);
        processImages(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        processImages(files);
        e.target.value = "";
    };

    const processImages = (files: File[]) => {
        files.forEach((file) => {
            if (!file.type.startsWith("image/")) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setImages((prev) => {
                        const next = [
                            ...prev,
                            {
                                image: img,
                                x: 100,
                                y: 100,
                                width: img.width,
                                height: img.height,
                            },
                        ];
                        pushHistory(next);
                        return next;
                    });
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const stage = stageRef.current?.getStage();
        const pointer = stage.getPointerPosition();

        // Calculate minimum zoom to show entire canvas
        const container = stage.getContainer();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const minZoomX = containerWidth / CANVAS_WIDTH;
        const minZoomY = containerHeight / CANVAS_HEIGHT;
        const minZoom = Math.max(minZoomX, minZoomY);

        const oldScale = zoom;
        const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
        
        // Clamp zoom to minimum
        const clampedScale = Math.max(newScale, minZoom);
        setZoom(clampedScale);

        // Calculate zoom center point on canvas
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        // Calculate new position to keep zoom centered on cursor
        let newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };

        const clampedPos = clampStagePosition(newPos, clampedScale);
        stage.position(clampedPos);
        stage.scale({ x: clampedScale, y: clampedScale });
    };

    const handleImageTransform = (idx: number, node: any) => {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        // Reset scale and apply to dimensions
        node.scaleX(1);
        node.scaleY(1);

        setImages((prev) => {
            const next = prev.map((img, i) =>
                i === idx
                    ? {
                        ...img,
                        width: (img.width ?? img.image.width) * scaleX,
                        height: (img.height ?? img.image.height) * scaleY,
                        x: node.x(),
                        y: node.y(),
                    }
                    : img
            );
            historyDirtyRef.current = true;
            return next;
        });
    };

    const handleImageDragEnd = (idx: number, e: any) => {
        setImages((prev) => {
            const next = prev.map((img, i) =>
                i === idx ? { ...img, x: e.target.x(), y: e.target.y() } : img
            );
            historyDirtyRef.current = true;
            return next;
        });
    };

    const handleSelectImage = (idx: number) => {
        if (selectedIdx !== null && selectedIdx !== idx) {
            commitHistoryIfDirty();
        }
        setSelectedIdx(idx);
    };

    const handleStageClick = () => {
        if (selectedIdx !== null) {
            setSelectedIdx(null);
            commitHistoryIfDirty();
        }
    };

    const handleZoomIn = () => {
        const stage = stageRef.current?.getStage();
        const container = stage.getContainer();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const newScale = Math.min(zoom * 1.2, 3);
        setZoom(newScale);

        // Center zoom on stage
        const newPos = {
            x: containerWidth / 2 - (containerWidth / 2 - stage.x()) / zoom * newScale,
            y: containerHeight / 2 - (containerHeight / 2 - stage.y()) / zoom * newScale,
        };

        stage.position(newPos);
        stage.scale({ x: newScale, y: newScale });
    };

    const handleZoomOut = () => {
        const stage = stageRef.current?.getStage();
        const container = stage.getContainer();
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const minZoomX = containerWidth / CANVAS_WIDTH;
        const minZoomY = containerHeight / CANVAS_HEIGHT;
        const minZoom = Math.max(minZoomX, minZoomY);

        const newScale = Math.max(zoom * 0.8, minZoom);
        setZoom(newScale);

        // Center zoom on stage
        const newPos = {
            x: containerWidth / 2 - (containerWidth / 2 - stage.x()) / zoom * newScale,
            y: containerHeight / 2 - (containerHeight / 2 - stage.y()) / zoom * newScale,
        };

        const clampedPos = clampStagePosition(newPos, newScale);
        stage.position(clampedPos);
        stage.scale({ x: newScale, y: newScale });
    };

    const handleZoomReset = () => {
        const stage = stageRef.current?.getStage();
        setZoom(1);
        stage.position(clampStagePosition({ x: 0, y: 0 }, 1));
        stage.scale({ x: 1, y: 1 });
    };

    const handleFinalize = () => {
        console.log("Finalize button clicked, selectedIdx:", selectedIdx);
        
        // If nothing is selected, generate the preview immediately
        if (selectedIdx === null) {
            const stage = stageRef.current?.getStage();
            if (stage) {
                const url = stage.toDataURL({ mimeType: "image/webp", quality: 0.8 });
                console.log("Setting finalized image URL:", url ? "Generated" : "Failed");
                setFinalizedImageUrl(url);
                setFinalizeModalOpen(true);
                console.log("Modal opened directly");
            }
        } else {
            // If something is selected, deselect it first and let the useEffect handle it
            finalizeRef.current = true;
            setSelectedIdx(null);
        }
    };

    const handleConfirmFinalize = async () => {
        const uid = jwtDecode<{ id: string }>(authCtx.token!).id;
        try {
            console.log("Attempting to save whiteboard...");
            await UserService.update(uid, { whiteboard: finalizedImageUrl! });
            console.log("Whiteboard saved successfully");
            toast.success("Montagem salva com sucesso! Você pode continuar editando ou voltar ao painel.");
            setFinalizeModalOpen(false);
        } catch (error) {
            console.error("Full error saving whiteboard:", error);
            if (error instanceof Error) {
                toast.error(`Erro ao salvar: ${error.message}`);
            } else {
                toast.error("Erro ao salvar a montagem. Por favor, tente novamente.");
            }
            return;
        }
    };

    const handleCloseFinalizeModal = () => {
        setFinalizeModalOpen(false);
        setFinalizedImageUrl(null);
    };

    if (isLoading) {
        return (
            <div className="w-full h-full min-h-screen bg-zinc-800 flex items-center justify-center text-white">
                <p className="text-2xl">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-screen bg-zinc-800 flex flex-col items-center justify-center p-4 md:p-5 gap-y-5 md:gap-y-6 text-white">
            <h1 className="text-xl md:text-2xl font-bold text-center max-w-xl">
                Crie uma montagem que represente você e seus interesses, usando as imagens que desejar!
            </h1>
            <div className="relative flex gap-4 w-full md:w-4/6 h-fit max-h-5/6">
                {hasExistingWhiteboard && (
                    <button
                        className="fixed top-4 left-4 bg-blue-600 rounded-lg px-3 text-white font-bold text-xl cursor-pointer z-50"
                        onClick={() => navigate('/dashboard')}
                    >
                        ← Voltar
                    </button>
                )}
                <button
                    className="fixed top-4 right-4 bg-amber-600 rounded-lg px-3 text-white font-bold text-xl cursor-pointer z-50"
                    onClick={() => authCtx.logout().then(() => navigate('/'))}
                >
                    Sair
                </button>

                {/* Toolbar */}
                <div className="absolute left-3 top-3 z-10 flex flex-col items-center gap-3 rounded-2xl bg-zinc-900/45 p-3 shadow-xl backdrop-blur-md md:static flex-shrink-0 overflow-y-scroll">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                    />
                    <Tooltip title="Upload images" placement="right">
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <IconButton
                                component="span"
                                size="large"
                                sx={{
                                    color: "white",
                                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)" },
                                }}
                            >
                                <CloudUpload />
                            </IconButton>
                        </label>
                    </Tooltip>

                    <div className="w-8 h-px bg-white/20" />

                    <Tooltip title="Zoom in" placement="right">
                        <IconButton
                            onClick={handleZoomIn}
                            size="large"
                            sx={{
                                color: "white",
                                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)" },
                            }}
                        >
                            <ZoomIn />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Zoom out" placement="right">
                        <IconButton
                            onClick={handleZoomOut}
                            size="large"
                            sx={{
                                color: "white",
                                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)" },
                            }}
                        >
                            <ZoomOut />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Reset zoom" placement="right">
                        <IconButton
                            onClick={handleZoomReset}
                            size="large"
                            sx={{
                                color: "white",
                                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)" },
                            }}
                        >
                            <Home />
                        </IconButton>
                    </Tooltip>

                    <div className="w-8 h-px bg-white/20" />

                    <Tooltip title="Undo" placement="right">
                        <IconButton
                            onClick={handleUndo}
                            size="large"
                            sx={{
                                color: "white",
                                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)" },
                            }}
                        >
                            <Undo />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Redo" placement="right">
                        <IconButton
                            onClick={handleRedo}
                            size="large"
                            sx={{
                                color: "white",
                                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.15)" },
                            }}
                        >
                            <Redo />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete selected image" placement="right">
                        <span>
                            <IconButton
                                onClick={deleteSelected}
                                disabled={selectedIdx === null}
                                size="large"
                                sx={{
                                    color: selectedIdx === null ? "#9CA3AF" : "white",
                                    "&:hover": selectedIdx !== null ? { bgcolor: "rgba(255, 255, 255, 0.15)" } : {},
                                    cursor: selectedIdx === null ? "not-allowed" : "pointer",
                                }}
                            >
                                <Delete />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title="Clear all images" placement="right">
                        <span>
                            <IconButton
                                onClick={clearAll}
                                disabled={images.length === 0}
                                size="large"
                                sx={{
                                    color: images.length === 0 ? "#9CA3AF" : "#ef4444",
                                    "&:hover": images.length > 0 ? { bgcolor: "rgba(239, 68, 68, 0.15)" } : {},
                                    cursor: images.length === 0 ? "not-allowed" : "pointer",
                                }}
                            >
                                <DeleteSweep />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <div className="w-8 h-px bg-white/20" />

                    <Tooltip title="Finalize and preview" placement="right">
                        <IconButton
                            onClick={handleFinalize}
                            size="large"
                            sx={{
                                color: "white",
                                backgroundColor: "#f97316",
                                "&:hover": { backgroundColor: "#ea580c" },
                            }}
                        >
                            <CheckCircle />
                        </IconButton>
                    </Tooltip>
                </div>

                {/* Canvas */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="relative flex-1 border-2 border-zinc-600 bg-white rounded-xl md:rounded-lg overflow-hidden md:overflow-auto h-[70vh] sm:h-[75vh] md:h-auto"
                >
                    <Stage
                        ref={stageRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        onWheel={handleWheel}
                        onClick={handleStageClick}
                        draggable={isMobilePanningEnabled}
                        dragBoundFunc={(pos) => clampStagePosition(pos, zoom)}
                    >
                        <Layer>
                            {images.map((item, idx) => (
                                <KonvaImage
                                    key={idx}
                                    id={`image-${idx}`}
                                    x={item.x}
                                    y={item.y}
                                    width={item.width ?? item.image.width}
                                    height={item.height ?? item.image.height}
                                    image={item.image}
                                    draggable
                                    onClick={(e) => {
                                        e.cancelBubble = true;
                                        handleSelectImage(idx);
                                    }}
                                    onDblTap={(e) => {
                                        e.cancelBubble = true;
                                        handleSelectImage(idx);
                                    }}
                                    onDragEnd={(e) => handleImageDragEnd(idx, e)}
                                    onTransformEnd={() => {
                                        const node = stageRef.current?.getStage().findOne(`#image-${idx}`);
                                        if (node) handleImageTransform(idx, node);
                                    }}
                                    onMouseEnter={() => {
                                        document.body.style.cursor = "pointer";
                                    }}
                                    onMouseLeave={() => {
                                        document.body.style.cursor = "default";
                                    }}
                                />
                            ))}
                            {selectedIdx !== null && (
                                <Transformer
                                    ref={transformerRef}
                                    boundBoxFunc={(_oldBoundBox, newBoundBox) => {
                                        return newBoundBox;
                                    }}
                                />
                            )}
                        </Layer>
                    </Stage>

                    {isMobilePanningEnabled && (
                        <div className="absolute right-3 bottom-3 grid grid-cols-3 grid-rows-3 gap-2 md:hidden">
                            <div />
                            <IconButton
                                aria-label="Pan up"
                                onClick={() => panStageBy(0, 80)}
                                size="large"
                                sx={{
                                    color: "white",
                                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                                    "&:hover": { backgroundColor: "rgba(15, 23, 42, 0.75)" },
                                }}
                            >
                                <ArrowUpward />
                            </IconButton>
                            <div />
                            <IconButton
                                aria-label="Pan left"
                                onClick={() => panStageBy(80, 0)}
                                size="large"
                                sx={{
                                    color: "white",
                                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                                    "&:hover": { backgroundColor: "rgba(15, 23, 42, 0.75)" },
                                }}
                            >
                                <ArrowBack />
                            </IconButton>
                            <div className="flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-zinc-400" />
                            </div>
                            <IconButton
                                aria-label="Pan right"
                                onClick={() => panStageBy(-80, 0)}
                                size="large"
                                sx={{
                                    color: "white",
                                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                                    "&:hover": { backgroundColor: "rgba(15, 23, 42, 0.75)" },
                                }}
                            >
                                <ArrowForward />
                            </IconButton>
                            <div />
                            <IconButton
                                aria-label="Pan down"
                                onClick={() => panStageBy(0, -80)}
                                size="large"
                                sx={{
                                    color: "white",
                                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                                    "&:hover": { backgroundColor: "rgba(15, 23, 42, 0.75)" },
                                }}
                            >
                                <ArrowDownward />
                            </IconButton>
                            <div />
                        </div>
                    )}
                </div>
            </div>

            {/* Finalize Modal */}
            <Modal
                open={finalizeModalOpen}
                onClose={handleCloseFinalizeModal}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        }
                    }
                }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90vw',
                        maxWidth: '672px',
                        maxHeight: '90vh',
                        bgcolor: '#27272a',
                        borderRadius: '12px',
                        boxShadow: 24,
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        outline: 'none',
                        overflowY: 'auto',
                    }}
                >
                    <h2 className="text-white text-2xl font-bold mb-4">Preview da Montagem</h2>
                    {finalizedImageUrl && (
                        <img
                            src={finalizedImageUrl}
                            alt="Finalized canvas"
                            className="max-w-full max-h-96 object-contain rounded-lg mb-4 border-2 border-cyan-400"
                        />
                    )}
                    <div className="flex flex-col gap-3 mt-auto pt-4">
                        <button
                            onClick={handleConfirmFinalize}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                        >
                            Salvar e Continuar Editando
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    handleConfirmFinalize().then(() => navigate("/dashboard"));
                                }}
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                            >
                                Salvar e Ir para Painel
                            </button>
                            <button
                                onClick={handleCloseFinalizeModal}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </Box>
            </Modal>
        </div>
    );
};
