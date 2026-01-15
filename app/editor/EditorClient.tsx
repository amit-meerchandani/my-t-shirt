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

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shirt = searchParams.get("shirt") || "white";
  const shirtImage = SHIRT_MAP[shirt] || SHIRT_MAP.white;

  const [uploadedImg, setUploadedImg] = useState<HTMLImageElement | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [controlBox, setControlBox] = useState<ControlBox | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [shirtKonvaImg, setShirtKonvaImg] = useState<HTMLImageElement | null>(
    null
  );

  const imageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<any>(null);

  /* ---------- Helpers ---------- */
  const updateControlBox = (node?: any) => {
    const target = node || imageRef.current;
    if (!target) return;
    // getClientRect provides the bounding box including rotation
    setControlBox(target.getClientRect());
  };

  const resetAfterUpload = () => {
    setProcessing(false);
    setShowControls(false);
    setControlBox(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------- Transformer ---------- */
  useEffect(() => {
    if (!showControls || previewMode || !trRef.current || !imageRef.current)
      return;

    trRef.current.nodes([imageRef.current]);
    trRef.current.getLayer()?.batchDraw();
    updateControlBox(imageRef.current);
  }, [showControls, previewMode]);

  useEffect(() => {
    const img = new Image();
    img.src = shirtImage;
    img.onload = () => setShirtKonvaImg(img);
  }, [shirtImage]);

  /* ---------- Upload ---------- */
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("remove.bg failed");

      const blob = await res.blob();
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => {
        setUploadedImg(img);
        resetAfterUpload();
      };
    } catch {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setUploadedImg(img);
        resetAfterUpload();
      };
    }
  };

  const deleteImage = () => {
    setUploadedImg(null);
    setShowControls(false);
    setControlBox(null);
  };

  const downloadDesign = () => {
    if (!stageRef.current) return;

    const prevPreview = previewMode;
    const prevControls = showControls;

    setPreviewMode(true);
    setShowControls(false);

    setTimeout(() => {
      const uri = stageRef.current.toDataURL({
        pixelRatio: 3,
        mimeType: "image/png",
      });

      const link = document.createElement("a");
      link.download = "tshirt-design.png";
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setPreviewMode(prevPreview);
      setShowControls(prevControls);
    }, 60);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        padding: 24,
        fontFamily: "Arial",
        color: "#f9fafb",
      }}
    >
      <button
        onClick={() => router.push("/")}
        style={{ color: "#a855f7", background: "none", border: "none" }}
      >
        ← Back
      </button>

      <h1>Design Your T-Shirt</h1>

      <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
        <div style={panelStyle}>
          <label style={toolBtn}>
            {processing ? "Removing few pixels…" : "Upload Image"}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              disabled={processing}
              onChange={onUpload}
            />
          </label>
        </div>

        <div style={canvasWrap}>
          <div style={shirtWrap}>
            <Stage
              ref={stageRef}
              width={360}
              height={420}
              onMouseDown={(e) => {
                // Clicked on empty space (not an image)
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) {
                  setShowControls(false);
                  setControlBox(null);
                }
              }}
            >
              <Layer>
                {shirtKonvaImg && (
                  <KonvaImage
                    image={shirtKonvaImg}
                    x={0}
                    y={0}
                    width={360}
                    height={420}
                    sceneFunc={(context, shape) => {
                      const img = shape.image();
                      if (img) {
                        const scale = 0.7;
                        const w = 480 * scale;
                        const h = 680 * scale;
                        context.drawImage(
                          img,
                          (360 - w) / 2,
                          (420 - h) / 2,
                          w,
                          h
                        );
                      }
                    }}
                  />
                )}

                {!previewMode && (
                  <Rect
                    x={108}
                    y={130}
                    width={140}
                    height={195}
                    stroke="#a855f7"
                    dash={[6, 4]}
                  />
                )}

                {uploadedImg && (
                  <KonvaImage
                    ref={imageRef}
                    image={uploadedImg}
                    x={140}
                    y={160}
                    width={80}
                    height={80}
                    draggable={!previewMode}
                    onClick={(e) => {
                      if (previewMode) return;
                      e.cancelBubble = true; // IMPORTANT: prevents Stage from clearing selection immediately
                      setShowControls(true);
                      updateControlBox(imageRef.current);
                    }}
                    onDragMove={() => updateControlBox(imageRef.current)}
                    // Added onTransform to keep the "X" button following the image during rotation/scaling
                    onTransform={() => updateControlBox(imageRef.current)}
                    onTransformEnd={() => updateControlBox(imageRef.current)}
                  />
                )}

                {/* 4. TRANSFORMER */}

                {showControls && !previewMode && (

                  <Transformer

                    ref={trRef}

                    rotateEnabled={true}

                    borderStroke="#a855f7"

                    anchorStroke="#a855f7"

                    anchorFill="#a855f7"

                    anchorSize={8}

                    anchorStyleFunc={(anchor) => {
            // make all anchors circles
            anchor.cornerRadius(50);
            // make all anchors red
            anchor.fill('white');
          }}

                  />

                )}

              </Layer>

              <Layer>
                {showControls && !previewMode && controlBox && (
                  <KonvaText
                    text="✕"
                    fontSize={18}
                    fill="#ef4444"
                    x={controlBox.x + controlBox.width - 5}
                    y={controlBox.y - 20}
                    cursor="pointer"
                    onClick={deleteImage}
                  />
                )}
              </Layer>
            </Stage>

            <button
              onClick={() => setPreviewMode((prev) => !prev)}
              style={{
                position: "absolute",
                right: -80,
                top: "35%",
                transform: "translateY(-50%)",
                width: 48,
                height: 48,
                borderRadius: "20%",
                background: previewMode ? "#a855f7" : "",
                border: "solid",
                borderColor: "#a855f7",
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
              title={previewMode ? "Exit Preview" : "Preview"}
            >
              <img
                src="https://i.ibb.co/5XrhZJ2x/tshirt.png"
                style={{ position: "relative", width: 35, left: 4.25 }}
                alt="preview"
              />
            </button>

            <button
              onClick={downloadDesign}
              style={{
                position: "absolute",
                right: -80,
                top: "50%",
                transform: "translateY(-50%)",
                width: 48,
                height: 48,
                borderRadius: "20%",
                background: "#a855f7",
                border: "solid",
                borderColor: "#a855f7",
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
              title="Download Design"
            >
              ⬇
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles (Unchanged) ---------- */
const panelStyle = {
  width: 220,
  background: "#1f2933",
  padding: 16,
  borderRadius: 12,
};
const toolBtn = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  background: "#374151",
  color: "#fff",
  cursor: "pointer",
};
const canvasWrap = {
  flex: 1,
  background: "#111827",
  padding: 24,
  borderRadius: 16,
  display: "flex",
  justifyContent: "center",
};
const shirtWrap = {
  width: 360,
  height: 420,
  background: "#fff",
  borderRadius: 18,
  position: "relative" as const,
};
