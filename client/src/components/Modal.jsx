import { X } from "lucide-react";

export default function Modal({ title, children, onClose, width = "560px" }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" aria-label="Close" title="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
