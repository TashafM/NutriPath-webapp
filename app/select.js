"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// Styled dropdown (native <select> options can't be styled in most browsers).
// options: [{ value, label }]. Keyboard: Enter/Space/arrows to open and move, Enter to pick, Esc to close.
export default function Select({ label, hint, value, onChange, options, placeholder, icon: Icon }) {
  const id = useId();
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => !root.current?.contains(event.target) && setOpen(false);
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function show() {
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  function pick(option) {
    onChange(option.value);
    setOpen(false);
    root.current.querySelector("button").focus();
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && open) {
      event.preventDefault(); // keep the surrounding dialog open
      setOpen(false);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return show();
      setActive((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      pick(options[active]);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className={open ? "select is-open" : "select"} ref={root} onKeyDown={onKeyDown}>
      <span className="select-label" id={`${id}-label`}>{label} {hint && <span>{hint}</span>}</span>
      <button
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? setOpen(false) : show())}
      >
        {Icon && <Icon size={17} />}
        <span id={`${id}-value`} className={selected ? "select-value" : "select-value is-placeholder"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={18} className="select-chevron" />
      </button>
      {open && (
        <ul className="select-list" role="listbox" aria-labelledby={`${id}-label`}>
          {options.map((option, index) => (
            <li
              key={option.value || "none"}
              role="option"
              aria-selected={option.value === value}
              className={index === active ? "is-active" : ""}
              onPointerEnter={() => setActive(index)}
              onClick={() => pick(option)}
            >
              {option.label}
              {option.value === value && <Check size={16} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
