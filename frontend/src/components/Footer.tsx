import { CREATOR } from "../config";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">🌌 ASTROVISION</span>
          <span className="footer-tag">
            Deep-learning galaxy classifier · realistic 3D cosmos
          </span>
        </div>

        <div className="footer-credit">
          <div className="footer-credit-line">
            <span className="footer-role">{CREATOR.role}</span>
            <span className="footer-name">{CREATOR.name}</span>
          </div>
          <div className="footer-links">
            <a href={`mailto:${CREATOR.email}`}>{CREATOR.email}</a>
            <span className="dot">·</span>
            <a href={CREATOR.linkedin} target="_blank" rel="noreferrer noopener">
              LinkedIn
            </a>
          </div>
        </div>

        <div className="footer-meta">
          <span>© {new Date().getFullYear()} AstroVision</span>
          <span className="footer-attrib">
            Imagery: NASA · ESA · Hubble · public domain
          </span>
        </div>
      </div>
    </footer>
  );
}
