
import Box from '@mui/material/Box';
import Masonry from '@mui/lab/Masonry';
import { styled } from '@mui/material/styles';

const ImageWrapper = styled('div')({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 4,
  cursor: 'pointer',
  '& img': {
    width: '100%',
    display: 'block',
    transition: 'transform 0.3s ease',
  },
  '&:hover img': {
    transform: 'scale(1.15)',
  },
  '&:hover .titleOverlay': {
    opacity: 1,
  },
});

const TitleOverlay = styled('div')({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'rgba(0,0,0,0.6)',
  color: 'white',
  padding: '0.5rem',
  textAlign: 'center',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  pointerEvents: 'none',
});

export default function ImageMasonry() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 1000,
        //imagen de fondo
        //backgroundImage: 'url()',
       // backgroundSize: 'cover',
        //backgroundPosition: 'center',
       // backgroundRepeat: 'no-repeat',
      }}
    >
      <Masonry columns={3} spacing={1} sx={{ width: 800 }}>
        {itemData.map((item, index) => (
          <ImageWrapper key={index}>
            <img src={item.img} alt={item.title} />
            <TitleOverlay className="titleOverlay">{item.title}</TitleOverlay>
          </ImageWrapper>
        ))}
      </Masonry>
    </Box>
  );
}

const itemData = [
  {
    img: 'https://as1.ftcdn.net/jpg/00/59/41/92/1000_F_59419298_0VXsGZLAunN7rk7yDVUVmEWXnc6SiCNY.jpg',
    title: 'Veïnat de Sant climent'
  },
  {
    img: 'https://media-cdn.tripadvisor.com/media/photo-s/04/4c/dd/e2/bicicarril.jpg',
    title: 'Rutes en bici',
  },
  {
    img: 'https://valldamer.cat/wp-content/uploads/2018/09/ermita-santa-brigida-amer.jpg',
    title: 'Ermita de Sta.Brígida',
  },
  {
    img: 'https://es.turismegarrotxa.com/img-apartat-3200-1800/a-45580_001.jpg',
    title: 'Els volcans de la Garrotxa'
  },
  {
    img: 'https://imagenes.elpais.com/resizer/v2/WSSRESHU2NGQBGA3LFUUMAK3WA.jpg?auth=fc26b5dcb255f9fb4c5f7caf0e24c964f5ea33911386e213e0e7edfb06848de0&width=980&height=980&smart=true',
    title: 'Cingle el Far'
  }
];
