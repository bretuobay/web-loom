const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="page-footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="https://github.com/web-loom" className="footer-link">
            GitHub
          </a>
          <a href="#" className="footer-link">
            Documentation
          </a>
          <a href="#" className="footer-link">
            Support
          </a>
        </div>
        <p className="footer-copy">&copy; {currentYear} GreenHouse Monitor. Powered by Web Loom Design System.</p>
      </div>
    </footer>
  );
};

export default Footer;
