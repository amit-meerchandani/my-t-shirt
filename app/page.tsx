"use client";

import { useState } from "react";

const COLORS = [
  { name: "Black", hex: "#000000", image: "/tshirts/black.png" },
  { name: "Navy", hex: "#0b2545", image: "/tshirts/navy.png" },
  { name: "Maroon", hex: "#4b1220", image: "/tshirts/maroon.png" },
  { name: "Dark Grey", hex: "#2f2f2f", image: "/tshirts/darkgrey.png" },
  { name: "White", hex: "#ffffff", image: "/tshirts/white.png" },
];


export default function HomePage() {
  const [selected, setSelected] = useState(COLORS[0]);

  return (
    <div style={{ padding: "24px", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "26px", marginBottom: "16px" }}>
        Select Your T-Shirt Color
      </h1>

      {/* Color Swatches */}
      <div style={{ display: "flex", gap: "12px" }}>
        {COLORS.map((c) => (
          <button
            key={c.name}
            onClick={() => setSelected(c)}
            style={{
              width: "50px",
              height: "50px",
              background: c.hex,
              borderRadius: "8px",
              border: selected.name === c.name ? "3px solid orange" : "2px solid white",
              cursor: "pointer",
            }}
          ></button>
        ))}
      </div>

      {/* T-Shirt Mockup */}
      <div
        style={{
          width: "300px",
          height: "350px",
          borderRadius: "14px",
          background:
            selected.name === "White"
              ? "#e6e6e6" // Light grey background for white shirt
              : "#ffffff", // White background for all other shirts
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: "20px",
          overflow: "hidden",
        }}
      >
        <img
          src={selected.image}
          alt={selected.name}
          style={{
            width: "70%",
            height: "auto",
          }}
        />
      </div>

      {/* Editor Page Link */}
      <a
  href={`/editor?shirt=${selected.name.toLowerCase().replace(" ", "")}`}
  style={{
    display: "inline-block",
    marginTop: "16px",
    padding: "10px 16px",
    background: "#111",
    color: "#fff",
    borderRadius: "8px",
    textDecoration: "none",
  }}
>
  Open Editor
</a>

    </div>
  );
}