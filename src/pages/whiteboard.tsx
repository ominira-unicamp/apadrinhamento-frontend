import { IconButton, Tooltip, Modal } from "@mui/material";
import { CloudUpload, Delete, ZoomIn, ZoomOut, Home, CheckCircle, Undo, Redo } from "@mui/icons-material";

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";

type ImageData = {
    image: HTMLImageElement;
    x: number;
    y: number;
    width?: number;
    height?: number;
};

export const WhiteboardPage = () => {
    const [images, setImages] = useState<ImageData[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
    const [finalizedImageUrl, setFinalizedImageUrl] = useState<string | null>(null);
    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const historyRef = useRef<ImageData[][]>([[]]);
    const historyStepRef = useRef(0);
    const imagesRef = useRef<ImageData[]>([]);
    const historyDirtyRef = useRef(false);

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

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIdx]);

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
        const minZoomX = containerWidth / 1500;
        const minZoomY = containerHeight / 800;
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

        // Constrain pan - keep canvas visible
        const maxX = 0;
        const minX = containerWidth - 1500 * clampedScale;
        const maxY = 0;
        const minY = containerHeight - 800 * clampedScale;

        newPos.x = Math.max(Math.min(newPos.x, maxX), minX);
        newPos.y = Math.max(Math.min(newPos.y, maxY), minY);

        stage.position(newPos);
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
        const minZoomX = containerWidth / 1500;
        const minZoomY = containerHeight / 800;
        const minZoom = Math.max(minZoomX, minZoomY);

        const newScale = Math.max(zoom * 0.8, minZoom);
        setZoom(newScale);

        // Center zoom on stage
        const newPos = {
            x: containerWidth / 2 - (containerWidth / 2 - stage.x()) / zoom * newScale,
            y: containerHeight / 2 - (containerHeight / 2 - stage.y()) / zoom * newScale,
        };

        // Constrain pan
        const maxX = 0;
        const minX = containerWidth - 1500 * newScale;
        const maxY = 0;
        const minY = containerHeight - 800 * newScale;

        newPos.x = Math.max(Math.min(newPos.x, maxX), minX);
        newPos.y = Math.max(Math.min(newPos.y, maxY), minY);

        stage.position(newPos);
        stage.scale({ x: newScale, y: newScale });
    };

    const handleZoomReset = () => {
        const stage = stageRef.current?.getStage();
        setZoom(1);
        stage.position({ x: 0, y: 0 });
        stage.scale({ x: 1, y: 1 });
    };

    const handleFinalize = () => {
        const stage = stageRef.current?.getStage();
        console.log(stage);
        console.log(stageRef.current);
        if (stage) {
            const url = stage.toDataURL();
            setFinalizedImageUrl(url);
            setFinalizeModalOpen(true);
        }
    };

    const handleConfirmFinalize = () => {
        // TODO: Here you can save the image or do whatever you need
        console.log("Image finalized:", finalizedImageUrl);
        setFinalizeModalOpen(false);
    };

    const handleCloseFinalizeModal = () => {
        setFinalizeModalOpen(false);
        setFinalizedImageUrl(null);
    };

    return (
        <div className="w-full h-full min-h-screen bg-zinc-800 flex flex-col items-center justify-center p-5 gap-y-6 text-white">
            <h1 className="text-4xl font-bold text-center max-w-xl">
                Crie uma montagem que represente você e seus interesses, usando as imagens que desejar!
            </h1>
            <div className="flex gap-4 w-4/6  h-fit max-h-5/6">
                {/* Toolbar */}
                <div className="flex flex-col items-center gap-3 bg-zinc-700 p-3 rounded-lg flex-shrink-0">
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
                    className="flex-1 border-2 border-zinc-600 bg-white rounded-lg overflow-auto"
                >
                    <Stage
                        ref={stageRef}
                        width={1500}
                        height={800}
                        onWheel={handleWheel}
                        onClick={handleStageClick}
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
                </div>
            </div>

            {/* Finalize Modal */}
            <Modal
                open={finalizeModalOpen}
                onClose={handleCloseFinalizeModal}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(128, 128, 128, 0.2)',
                }}
            >
                <div className="bg-zinc-800 rounded-xl p-8 w-[90vw] max-h-[90vh] max-w-2xl flex flex-col shadow-2xl outline-none overflow-y-auto">
                    <h2 className="text-white text-2xl font-bold mb-4">Preview da Montagem</h2>
                    {finalizedImageUrl && (
                        <img
                            src={finalizedImageUrl}
                            alt="Finalized canvas"
                            className="max-w-full max-h-96 object-contain rounded-lg mb-4 border-2 border-cyan-400"
                        />
                    )}
                    <div className="flex gap-4 mt-auto pt-4">
                        <button
                            onClick={handleCloseFinalizeModal}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={handleConfirmFinalize}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
