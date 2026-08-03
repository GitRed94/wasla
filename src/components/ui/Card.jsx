export default function Card({ className = '', children, ...rest }) {
  return (
    <div className={`bg-surface rounded-card shadow-sm animate-fade-in ${className}`} {...rest}>
      {children}
    </div>
  )
}
