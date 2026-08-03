const TONES = {
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-100 text-primary',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-secondary',
}

export default function Badge({ tone = 'gray', className = '', children }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}
