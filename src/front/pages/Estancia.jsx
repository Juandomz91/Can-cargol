import * as React from "react";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Masonry from "@mui/lab/Masonry";

const images = [
  { src: "https://picsum.photos/300/200?1", title: "Imagen 1" },
  { src: "https://picsum.photos/300/250?2", title: "Imagen 2" },
  { src: "https://picsum.photos/300/180?3", title: "Imagen 3" },
  { src: "https://picsum.photos/300/220?4", title: "Imagen 4" },
  { src: "https://picsum.photos/300/210?5", title: "Imagen 5" },
  { src: "https://picsum.photos/300/260?6", title: "Imagen 6" },
];

const ImageWrapper = styled("div")({
  position: "relative",
  overflow: "hidden",
  borderRadius: "12px",
  cursor: "pointer",
  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.4s ease",
  },
  "&:hover img": {
    transform: "scale(1.1)",
  },
  "& .overlay": {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    padding: "8px",
    textAlign: "center",
    opacity: 0,
    transition: "opacity 0.3s ease",
  },
  "&:hover .overlay": {
    opacity: 1,
  },
});

export default function Estancia() {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Box sx={{ width: 600 }}>
        <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
          {images.map((item, index) => (
            <ImageWrapper key={index}>
              <img src={item.src} alt={item.title} />
              <div className="overlay">{item.title}</div>
            </ImageWrapper>
          ))}
        </Masonry>
      </Box>
    </Box>
  );
}
