import { useEffect, useRef, useState } from "react";
import styles from "./EditModal.module.css";
import { FaTimes } from "react-icons/fa";

const EditModal = ({
  isOpen,
  title,
  fields,
  values,
  onChange,
  onClose,
  onSubmit,
  submitLabel = "Save Changes",
  submitting = false,
}) => {
  const anchorRef = useRef(null);
  const [overlayTop, setOverlayTop] = useState(0);
  const [overlayHeight, setOverlayHeight] = useState(0);

  useEffect(() => {
    if (!isOpen) return undefined;

    const findScrollParent = (element) => {
      let current = element?.parentElement;
      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        if (/(auto|scroll)/.test(style.overflowY || "")) return current;
        current = current.parentElement;
      }
      return null;
    };

    const scrollParent = findScrollParent(anchorRef.current);
    if (!scrollParent) return undefined;
    const previousOverflow = scrollParent.style.overflow;
    scrollParent.style.overflow = "hidden";

    const updateOverlayPosition = () => {
      setOverlayTop(scrollParent.scrollTop);
      setOverlayHeight(scrollParent.clientHeight);
    };

    updateOverlayPosition();
    scrollParent.addEventListener("scroll", updateOverlayPosition);
    window.addEventListener("resize", updateOverlayPosition);

    return () => {
      scrollParent.style.overflow = previousOverflow;
      scrollParent.removeEventListener("scroll", updateOverlayPosition);
      window.removeEventListener("resize", updateOverlayPosition);
    };
  }, [isOpen]);

  if (!isOpen) return <div ref={anchorRef} />;

  return (
    <>
      <div ref={anchorRef} />
      <div
        className={styles.overlay}
        style={{ top: `${overlayTop}px`, height: overlayHeight ? `${overlayHeight}px` : undefined }}
        onClick={onClose}
      >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <FaTimes />
          </button>
        </div>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {fields.map((field) => (
            <div key={field.name} className={styles.field}>
              <label>{field.label}</label>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={values[field.name] ?? ""}
                  onChange={onChange}
                  required={field.required}
                >
                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={values[field.name] ?? ""}
                  onChange={onChange}
                  placeholder={field.placeholder || ""}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={submitting}>
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
};

export default EditModal;
