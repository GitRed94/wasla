export default function Tabs({ items, active, onChange }) {
  return (
    <div role="tablist" className="flex border-b border-gray-200 mb-6 overflow-x-auto">
      {items.map(item => {
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
