import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Tela ainda não migrada do sistema legado. Usada para manter toda a navegação
 * (menus/submenus) já funcional enquanto os demais módulos são desenvolvidos.
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} description="Módulo em desenvolvimento." />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <Construction className="size-10" />
          <p>Esta tela ainda será migrada do sistema legado nas próximas etapas.</p>
        </CardContent>
      </Card>
    </>
  )
}
