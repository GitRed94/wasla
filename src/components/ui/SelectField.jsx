import { useState, useRef, useEffect } from 'react'

export default function SelectField({ value, onChange, placeholder, options, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white rounded-lg text-sm text-left border border-gray-200"
      >
        <span className={`truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <li
            role="option"
            aria-selected={!value}
            onClick={() => { onChange(''); setOpen(false) }}
            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${!value ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
          >
            {placeholder}
          </li>
          {options.map(o => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${o.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
