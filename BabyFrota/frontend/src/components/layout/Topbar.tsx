import { useEffect, useState } from 'react'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'

function useRelogio() {
  const [agora, setAgora] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return agora
}

export function Topbar() {
  const agora = useRelogio()
  const { usuario, logout } = useAuthStore()
  const alternarSidebar = useUiStore((s) => s.alternarSidebar)
  const abrirMenuMobile = useUiStore((s) => s.abrirMenuMobile)

  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const data = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  // Mesmo botão nas duas larguras: no desktop recolhe/expande a sidebar fixa; no celular abre o menu por cima da página.
  function alternarMenu() {
    if (window.matchMedia('(min-width: 768px)').matches) alternarSidebar()
    else abrirMenuMobile()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 print:hidden md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={alternarMenu} aria-label="Alternar menu" title="Menu">
          <Menu />
        </Button>
        <div>
          <p className="text-sm font-semibold tabular-nums">{hora}</p>
          <p className="text-xs text-muted-foreground">{data}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {usuario && (
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{usuario.nome}</p>
            <p className="text-xs text-muted-foreground leading-tight">{usuario.perfilNome}</p>
          </div>
        )}
        <Button variant="outline" size="icon" onClick={logout} title="Sair">
          <LogOut />
        </Button>
      </div>
    </header>
  )
}
