import { useEffect, useState } from 'react'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useTopbarStore } from '@/store/topbar-store'
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
  const definirTitulo = useTopbarStore((s) => s.definirTitulo)
  const definirAcoes = useTopbarStore((s) => s.definirAcoes)

  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const data = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  // Mesmo botão nas duas larguras: no desktop recolhe/expande a sidebar fixa; no celular abre o menu por cima da página.
  function alternarMenu() {
    if (window.matchMedia('(min-width: 768px)').matches) alternarSidebar()
    else abrirMenuMobile()
  }

  return (
    <header className="flex h-16 items-center gap-3 border-b bg-card px-4 print:hidden md:px-6">
      <Button variant="ghost" size="icon" className="shrink-0" onClick={alternarMenu} aria-label="Alternar menu" title="Menu">
        <Menu />
      </Button>
      <div className="hidden shrink-0 sm:block">
        <p className="text-sm font-semibold tabular-nums">{hora}</p>
        <p className="text-xs text-muted-foreground">{data}</p>
      </div>

      {/* Nome e descrição da tela: cada página os coloca aqui pelo PageHeader. */}
      <div ref={definirTitulo} className="min-w-0 flex-1" />

      {/* Ações da tela (ex.: "Novo cliente"), também colocadas pelo PageHeader. */}
      <div ref={definirAcoes} className="flex shrink-0 items-center gap-2" />

      <div className="flex shrink-0 items-center gap-4">
        {usuario && (
          <div className="hidden text-right lg:block">
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
