export const Footer = () => {
  const footerStyle = {
    backgroundColor: '#596c0eff', // mismo verde que el navbar
    color: 'white',
    padding: '1rem 1rem',
    textAlign: 'center'
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'underline'
  };

  return (
    <footer style={footerStyle}>
      <p>
        Can cargol, casa de repós. <br></br>
        Telèfon: +34 622 584 002
      </p>
      <p>
        Lorem ipsum dolor est Lorem ipsum dolor est Lorem ipsum dolor est Lorem ipsum dolor est Lorem ipsum dolor est Lorem ipsum dolor est
      </p>
    </footer>
  );
};
