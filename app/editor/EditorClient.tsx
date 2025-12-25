"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Transformer,
  Text as KonvaText,
} from "react-konva";
import { useEffect, useRef, useState } from "react";

const SHIRT_MAP: Record<string, string> = {
  black: "/tshirts/black.png",
  navy: "/tshirts/navy.png",
  maroon: "/tshirts/maroon.png",
  darkgrey: "/tshirts/darkgrey.png",
  white: "/tshirts/white.png",
};

type ControlBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TextItem = {
  id: string;
  text: string;
  x: number;
  y: number;
};

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shirt = searchParams.get("shirt") || "white";
  const shirtImage = SHIRT_MAP[shirt] || SHIRT_MAP.white;

  const [uploadedImg, setUploadedImg] = useState<HTMLImageElement | null>(null);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [controlBox, setControlBox] = useState<ControlBox | null>(null);

  const imageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateControlBox = (node?: any) => {
    const target = node || imageRef.current;
    if (!target) return;
    const box = target.getClientRect();
    setControlBox(box);
  };

  useEffect(() => {
    if (!showControls || !trRef.current) return;

    if (selectedTextId) {
      const textNode = trRef.current
        .getLayer()
        ?.findOne(`#${selectedTextId}`);
      if (textNode) {
        trRef.current.nodes([textNode]);
        updateControlBox(textNode);
      }
    } else if (imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      updateControlBox(imageRef.current);
    }

    trRef.current.getLayer()?.batchDraw();
  }, [showControls, selectedTextId]);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setUploadedImg(img);
      setShowControls(false);
      setControlBox(null);
      setSelectedTextId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
  };

  const addText = () => {
    const id = Date.now().toString();
    setTexts([...texts, { id, text: "Your Text", x: 140, y: 200 }]);
    setSelectedTextId(id);
    setShowControls(true);
  };

  const deleteSelected = () => {
    if (selectedTextId) {
      setTexts(texts.filter((t) => t.id !== selectedTextId));
      setSelectedTextId(null);
    } else {
      setUploadedImg(null);
    }
    setShowControls(false);
    setControlBox(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        padding: "24px",
        fontFamily: "Arial",
        color: "#f9fafb",
      }}
    >
      <button
        onClick={() => router.push("/")}
        style={{
          marginBottom: "16px",
          background: "transparent",
          border: "none",
          color: "#a855f7",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h1>Design Your T-Shirt</h1>

      <div style={{ display: "flex", gap: "24px", marginTop: "20px" }}>
        {/* TOOLS */}
        <div style={panelStyle}>
          <label style={toolBtn}>
            Upload Image
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={onUpload}
            />
          </label>

          {/* <button style={toolBtn} onClick={addText}>
            Add Text
          </button> */}
        </div>

        {/* CANVAS */}
        <div style={canvasWrap}>
          <div style={shirtWrap}>
            <img src={shirtImage} alt="shirt" style={shirtStyle} />

            <Stage
              width={360}
              height={420}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) {
                  setShowControls(false);
                  setSelectedTextId(null);
                  setControlBox(null);
                }
              }}
            >
              <Layer>
                <Rect
                  x={118}
                  y={134}
                  width={120}
                  height={185}
                  stroke="#a855f7"
                  dash={[6, 4]}
                />

                {uploadedImg && (
                  <KonvaImage
                    ref={imageRef}
                    image={uploadedImg}
                    x={140}
                    y={160}
                    width={80}
                    height={80}
                    draggable
                    onClick={() => {
                      setSelectedTextId(null);
                      setShowControls(true);
                      updateControlBox(imageRef.current);
                    }}
                    onDragMove={() => updateControlBox(imageRef.current)}
                    onTransformEnd={() => updateControlBox(imageRef.current)}
                  />
                )}

                {texts.map((t) => (
                  <KonvaText
                    key={t.id}
                    id={t.id}
                    text={t.text}
                    x={t.x}
                    y={t.y}
                    fontSize={24}
                    fill="#000"
                    draggable
                    onClick={() => {
                      setSelectedTextId(t.id);
                      setShowControls(true);
                    }}
                    onDragMove={(e) => {
                      setTexts(
                        texts.map((tx) =>
                          tx.id === t.id
                            ? { ...tx, x: e.target.x(), y: e.target.y() }
                            : tx
                        )
                      );
                      updateControlBox(e.target);
                    }}
                    onTransformEnd={(e) => updateControlBox(e.target)}
                  />
                ))}

                {showControls && (
                  <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    borderStroke="#a855f7"
                    anchorStroke="#a855f7"
                    anchorFill="#a855f7"
                    anchorSize={8}
                  />
                )}
              </Layer>

              <Layer listening>
                {showControls && controlBox && (
                  <KonvaText
                    text="✕"
                    fontSize={16}
                    fill="#ef4444"
                    x={controlBox.x + controlBox.width - 6}
                    y={controlBox.y - 18}
                    cursor="pointer"
                    onClick={deleteSelected}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}

/* styles */
const panelStyle = {
  width: "220px",
  background: "#1f2933",
  padding: "16px",
  borderRadius: "12px",
};

const toolBtn = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#374151",
  color: "#f9fafb",
  cursor: "pointer",
};

const canvasWrap = {
  flex: 1,
  background: "#111827",
  padding: "24px",
  borderRadius: "16px",
  display: "flex",
  justifyContent: "center",
};

const shirtWrap = {
  width: 360,
  height: 420,
  background: "#fff",
  borderRadius: "18px",
  position: "relative" as const,
};

const shirtStyle = {
  width: "70%",
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none" as const,
};
