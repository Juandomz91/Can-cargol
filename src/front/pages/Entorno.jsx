import * as React from "react";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Masonry from "@mui/lab/Masonry";

const images = [
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/578583960.jpg?k=b62e764b5292d397ed8a6bd5e647bb3ee8e0acc84cc635da78a90f7547af68bb&o=", title: "Can Cargol" },
  { src: "https://a0.muscache.com/im/pictures/airflow/Hosting-12658797/original/19023c73-9939-4795-93d2-6567aaafe947.jpg?im_w=1200", title: "Imagen 2" },
  { src: "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTI2NTg3OTc%3D/original/6e653096-9431-45cc-b596-08a0b25852cc.jpeg?im_w=720", title: "Imagen 3" },
  { src: "https://a0.muscache.com/im/pictures/airflow/Hosting-12658797/original/fbec7848-26a2-4f7a-92ad-fa76dbd42cea.jpg?im_w=720", title: "Imagen 4" },
  { src: "https://a0.muscache.com/im/pictures/airflow/Hosting-12658797/original/5e8e53cf-f340-4699-91be-c20edb974448.jpg?im_w=720", title: "Imagen 5" },
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

export default function Entorno() {
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
      <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>

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
