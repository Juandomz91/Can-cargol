import * as React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Masonry from "@mui/lab/Masonry";

const images = [
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/371769732.jpg?k=b54311777dcc674cfe099887a4557b72d4d8a1710fc2ee033e8988243b6ec56d&o=", title: "Imagen 1" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/371771001.jpg?k=6851c3eb4297924aa131312daaa2e6cb5d63eb537681d930f9a9981fb74fa4a7&o=", title: "Imagen 2" },
  { src: "https://a0.muscache.com/im/pictures/airflow/Hosting-12658797/original/a5d92b2d-7173-4e2a-9a87-70c0c2cce4ef.jpg?im_w=1200", title: "Imagen 3" },
  { src: "https://a0.muscache.com/im/pictures/airflow/Hosting-12658797/original/bb5e9c48-aa7f-4d7c-a0a2-8e2cfbe1bd7e.jpg?im_w=720", title: "Imagen 4" },
  { src: "https://a0.muscache.com/im/pictures/airflow/Hosting-12658797/original/19fe07c9-9080-4af9-93df-e78cda7348da.jpg?im_w=720", title: "Imagen 5" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/636590447.jpg?k=0ed2f3f2a497173e80b44bf571bb675d1f0c21a06614c122a9628b5ce3bd8c57&o=", title: "Imagen 6" },
  { src: "https://a0.muscache.com/im/pictures/airflow/Hosting-12658797/original/12aef7b2-b7d5-4196-82d8-ab598790309d.jpg?im_w=1200", title: "Imagen 7" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/143361502.jpg?k=c71ccc47299deccaa08c4d25403ceeaf63bdf8ff16273c3f054bcc0e1387f3de&o=", title: "Imagen 8" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/371773197.jpg?k=d47eb4d4fd5fff6929b70c254c95861add7037352dabc75107f78fa513bcb280&o=", title: "Imagen 9" },
  { src: "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTI2NTg3OTc=/original/b14b7dbc-f7e7-4af0-be11-16c970fbc11a.jpeg?im_w=720", title: "Imagen 10" },
  { src: "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTI2NTg3OTc=/original/09379acc-a4f3-431d-974e-71448f66f22a.jpeg?im_w=1200", title: "Imagen 11" },
  { src: "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTI2NTg3OTc=/original/9fc793bd-450c-4062-9c18-f7764bc687f3.jpeg?im_w=720", title: "Imagen 12" },
  { src: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/202121894.jpg?k=d8aab19fe36b288c9a69ccb2d5fb00b179b2cba21f21c70a45a17f92aa3e0124&o=&hp=1", title: "Imagen 13" },
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
  
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
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
              <ImageWrapper 
                key={index}
                onClick={() => setSelectedImage(item.src)} // ✅ Añadido onClick
              >
                <img src={item.src} alt={item.title} />
                <div className="overlay">{item.title}</div>
              </ImageWrapper>
            ))}
          </Masonry>
        </Box>
      </Box>

      {/*  Modal fuera del Box principal */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Imagen ampliada"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '48px',
              cursor: 'pointer',
              lineHeight: 1
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