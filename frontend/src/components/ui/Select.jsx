import React, { useEffect, useRef, useState } from 'react';

export function Select({
  label,
  options = [],
  error,
  className = '',
  id,
  value,
  onChange,
  disabled,
  placeholder,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) setHighlight(-1);
  }, [open]);

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  useEffect(() => {
    if (open && listRef.current && highlight >= 0) {
      const el = listRef.current.querySelectorAll('[data-option]')[highlight];
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight, open]);

   const toggle = () => {
   if (disabled) return;
   setOpen((s) => !s);
   };
   
  const handleSelect = (opt) => {
    if (disabled) return;
    // call onChange with event-like object
    if (onChange) onChange({ target: { value: opt.value } });
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && highlight >= 0) {
        handleSelect(options[highlight]);
      } else {
        setOpen((s) => !s);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`flex flex-col gap-xs w-full max-w-full min-w-0 box-border relative ${className}`} {...props}>
      {label && (
        <label htmlFor={selectId} className="font-label-caps text-label-caps text-on-surface-variant">
          {label}
        </label>
      )}

      <div
        id={selectId}
        role="combobox"
        aria-expanded={open}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={onKeyDown}
        className={`w-full max-w-full min-w-0 box-border h-12 bg-surface-container-lowest border border-outline-variant rounded-lg px-md font-body-lg text-body-lg text-primary flex items-center justify-between cursor-pointer transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={toggle}
      >
        <div className="truncate">{selected ? selected.label : placeholder || ''}</div>
        <span className="material-symbols-outlined text-[18px]">{open ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
      </div>

      {error && <p className="font-body-sm text-body-sm text-error mt-xs">{error}</p>}

      {open && (
        <div className="absolute left-0 right-0 mt-1 z-50 w-full max-w-full box-border" style={{ maxWidth: '100vw' }}>
          <div
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="bg-surface-container rounded-lg border border-outline-variant shadow-lg max-h-[240px] overflow-y-auto"
            onKeyDown={onKeyDown}
          >
            {options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = idx === highlight;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-option
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`w-full text-left px-md py-3 border-b last:border-b-0 transition-colors ${
                    isSelected
                      ? 'bg-primary-container text-on-primary font-semibold'
                      : isHighlighted
                      ? 'bg-surface-container-high'
                      : 'bg-surface'
                  }`}
                >
                  <div className="truncate">{opt.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
