export function Footer() {
  return (
    <footer className="layout-footer">
      <div>
        <strong>TaskFlow Demo</strong>
        <p className="layout-footer__note">
          Project management showcase built with Web Loom MVVM, shared models, and plugin-first architecture.
        </p>
      </div>
      <div className="layout-footer__links">
        <a href="https://web-loom.dev" target="_blank" rel="noreferrer">
          Docs
        </a>
        <a href="https://github.com/bretuobay/web-loom" target="_blank" rel="noreferrer">
          Source
        </a>
        <a href="https://web-loom.dev/design" target="_blank" rel="noreferrer">
          Design tokens
        </a>
      </div>
      <p className="layout-footer__cta">© 2026 Web Loom</p>
    </footer>
  );
}
