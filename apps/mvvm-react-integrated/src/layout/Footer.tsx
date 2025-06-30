const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="page-footer">
      <p className="footer-branding">&copy; {currentYear} Dashboard Demo. All rights reserved.</p>
    </footer>
  );
};
export default Footer;
