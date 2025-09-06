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
        Check the{' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://4geeks.com/docs/start/react-flask-template"
          style={linkStyle}
        >
          template documentation
        </a>{' '}
        <i className="fa-solid fa-file"></i> for help.
      </p>
      <p>
        Lorem ipsum dolor est Lorem ipsum dolor est Lorem ipsum dolor est Lorem ipsum dolor est Lorem ipsum dolor est Lorem ipsum dolor est
      </p>
    </footer>
  );
};
