import * as React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Masonry from "@mui/lab/Masonry";

const images = [
  { src: "https://imgs.search.brave.com/veI3dBaZA7Vw_4gDPmooe7EOXpkBTAwjyJj3B_-D0iw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hY3Rp/dml0YXRzZ2Fycm90/eGEuY29tL3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDI0LzEwL3Zv/bGNhLWNyb3NjYXQt/MTAyNHg1NzYuanBn", title: "Volcans de la Garrotxa" },
  { src: "https://imgs.search.brave.com/3lNL2b0YjFFnMhJIAU05UUzOak7rvoNnS1_HBT8VKZc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/c2Vlbi5kZS9zZWVu/X2RiL3N0YXRpYy9p/bWcvaGVhZGVyL3Nl/ZW4uanBn", title: "Pantà de Susqueda" },
  { src: "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTI2NTg3OTc%3D/original/6e653096-9431-45cc-b596-08a0b25852cc.jpeg?im_w=720", title: "Can Cargol" },
  { src: "https://imgs.search.brave.com/U9BXZYYMR5COEFRU4dvn5_vQ1w9gwIpYWhyoZKATiqM/rs:fit:860:0:0:0/g:ce/aHR0cDovL3ZhbGxk/YW1lci5jYXQvd3At/Y29udGVudC91cGxv/YWRzLzIwMTgvMDkv/ZXJtaXRhLXNhbnRh/LWJyaWdpZGEtYW1l/ci0yLmpwZw", title: "Sta. Brígida" },
  { src: "https://imgs.search.brave.com/pVtXE0ecuXkVqA2ujWK6sgtOYvKOhsH-r7tumI_7g-c/rs:fit:860:0:0:0/g:ce/aHR0cDovL3ZhbGxk/YW1lci5jYXQvd3At/Y29udGVudC91cGxv/YWRzLzIwMTgvMTEv/Y2luZ2xlLWRlbC1m/YXItc2FudHVhcmkt/c2FudC1tYXJ0aS1h/bWVyLW11bnRhbnlh/LTQuanBn", title: "Santuari El Far" },
  { src: "https://imgs.search.brave.com/tFf6B8ZCenUXCJ6jVeDipx5f2q97HM641fJGsXdKvno/rs:fit:860:0:0:0/g:ce/aHR0cDovL3R1cmlz/bWUuYW1lci5jYXQv/d3AtY29udGVudC91/cGxvYWRzLzIwMTgv/MDMvYmljaWNhcnJp/bC1sbG9ndWVyLXRy/YW5zcG9ydC1iaWNp/Y2xldGVzLWFtZXIt/Mi5qcGc", title: "Bicicarril" },
];

const ImageWrapper = styled("div")({
  position: "relative",
  overflow: "hidden",
  borderRadius: "4px",
  cursor: "pointer",
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.4s ease",
  },
  "&:hover img": {
    transform: "scale(1.06)",
  },
  "& .overlay": {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "linear-gradient(0deg, rgba(31,51,39,0.85), transparent)",
    color: "#F6F4EE",
    padding: "20px 14px 12px",
    textAlign: "left",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    fontSize: 15,
    opacity: 0,
    transition: "opacity 0.3s ease",
  },
  "&:hover .overlay": {
    opacity: 1,
  },
});

export default function Entorno() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <Box sx={{ width: "100%", minHeight: "100vh", background: "#F6F4EE", py: 8, px: 2 }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", mb: 5, textAlign: "center" }}>
          <Box
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: { xs: 30, md: 34 },
              color: "#1F3327",
            }}
          >
            El entorno
          </Box>
          <Box sx={{ fontSize: 15, color: "#4B5647", mt: 1.5 }}>
            Rutas en bicicleta, senderos y montañas cubiertas de bosque a las puertas de casa.
          </Box>
        </Box>

        <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
          <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
            {images.map((item, index) => (
              <ImageWrapper key={index} onClick={() => setSelectedImage(item.src)}>
                <img src={item.src} alt={item.title} />
                <div className="overlay">{item.title}</div>
              </ImageWrapper>
            ))}
          </Masonry>
        </Box>
      </Box>

      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(20,26,20,0.92)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Imagen ampliada"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "none",
              border: "none",
              color: "#C9A66B",
              fontSize: "48px",
              cursor: "pointer",
              lineHeight: 1,
              fontWeight: "bold",
            }}
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
