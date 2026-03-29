import { useNavigate } from '@tanstack/react-router'
import { ChevronRight, Home } from 'lucide-react'

type Props = {
  dbKey: string
  label?: string
}

const Breadcrumbs = ({ dbKey, label }: Props) => {
  const navigate = useNavigate()
  return (
    <nav className="p-2 h-12 shrink-0 flex items-center gap-1 text-sm text-muted-foreground border-b border-gray-300">
      <div
        onClick={() => navigate({ to: '/dbconn' })}
        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
      >
        <Home className="h-4 w-4" />
      </div>
      <ChevronRight className="h-3 w-3" />
      <span>{dbKey}</span>
      {label && (
        <>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate"> {label}</span>
        </>
      )}
    </nav>
  )
}

export default Breadcrumbs
