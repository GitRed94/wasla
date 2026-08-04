import { useState, useRef, useEffect } from 'react'

function normalizeText(str) {
  return str
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function SelectField({ value, onChange, placeholder, options, className = '' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const filtered = search.trim()
    ? options.filter(o => normalizeText(o.label).startsWith(normalizeText(search)))
    : options

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }))
    } else {
      setSearch('')
    }
  }, [open])

  function handleSearchKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); setSearch('') }
    if (e.key === 'ArrowDown' && listRef.current) {
      listRef.current.querySelector('[role="option"]')?.focus()
    }
    if (e.key === 'Enter' && filtered.length === 1) {
      onChange(filtered[0].value)
      setOpen(false)
      setSearch('')
    }
  }

  function handleItemKeyDown(e, optValue) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange(optValue)
      setOpen(false)
      setSearch('')
    } else if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = e.currentTarget.nextElementSibling
      next ? next.focus() : searchRef.current?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = e.currentTarget.previousElementSibling
      prev ? prev.focus() : searchRef.current?.focus()
    }
  }

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
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
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-2 pt-2 pb-1 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Rechercher..."
              className="w-full text-sm px-2 py-1.5 bg-white text-gray-800 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <ul ref={listRef} role="listbox" className="max-h-52 overflow-y-auto py-1">
            {!search && (
              <li
                role="option"
                tabIndex={0}
                aria-selected={!value}
                onClick={() => { onChange(''); setOpen(false); setSearch('') }}
                onKeyDown={e => handleItemKeyDown(e, '')}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${!value ? 'text-primary font-medium' : 'text-gray-400'}`}
              >
                {placeholder}
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">Aucun résultat</li>
            ) : (
              filtered.map(o => (
                <li
                  key={o.value}
                  role="option"
                  tabIndex={0}
                  aria-selected={o.value === value}
                  onClick={() => { onChange(o.value); setOpen(false); setSearch('') }}
                  onKeyDown={e => handleItemKeyDown(e, o.value)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${o.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

