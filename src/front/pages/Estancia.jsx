import * as React from "react";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Masonry from "@mui/lab/Masonry";

const images = [
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/371769732.jpg?k=b54311777dcc674cfe099887a4557b72d4d8a1710fc2ee033e8988243b6ec56d&o=", title: "Imagen 1" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/371771001.jpg?k=6851c3eb4297924aa131312daaa2e6cb5d63eb537681d930f9a9981fb74fa4a7&o=", title: "Imagen 2" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/371771296.jpg?k=038dbf4764656faac96cd09aeb55ba96a2c76e1ed0a2508c40bee6bcf6fa8516&o=", title: "Imagen 3" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/371771884.jpg?k=f3d1f5955146dd0ee21646e76822c7e26a6f8331b1515e94fe57e7677d59c759&o=", title: "Imagen 4" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/371772596.jpg?k=eb7530135064d420e9fa32b4227fefaefc779d8b148d0a4fc32e47a1a0300e71&o=", title: "Imagen 5" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/636590447.jpg?k=0ed2f3f2a497173e80b44bf571bb675d1f0c21a06614c122a9628b5ce3bd8c57&o=", title: "Imagen 6" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/647669335.jpg?k=8b2e9132e24079754a6c9ae53c276cd19912c4dc71739c4eb5db107a3f66a6ac&o=", title: "Imagen 6" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/143361502.jpg?k=c71ccc47299deccaa08c4d25403ceeaf63bdf8ff16273c3f054bcc0e1387f3de&o=", title: "Imagen 6" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/371773197.jpg?k=d47eb4d4fd5fff6929b70c254c95861add7037352dabc75107f78fa513bcb280&o=", title: "Imagen 6" },


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
