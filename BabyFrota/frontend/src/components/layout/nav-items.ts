import {
  LayoutDashboard,
  Users,
  UserCog,
  Baby,
  Tag,
  Building2,
  PackageCheck,
  ClipboardList,
  Wallet,
  Landmark,
  ArrowLeftRight,
  Printer,
  FileBarChart,
  History,
  FolderOpen,
  ShoppingBag,
  Coins,
  ChartColumn,
  ChartNoAxesCombined,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface NavGroup {
  /** null = grupo "fixo" sem cabeçalho (usado para o Dashboard, sempre no topo). */
  label: string | null
  /** Ícone do cabeçalho do grupo recolhível; ignorado no grupo fixo. */
  icon?: LucideIcon
  items: NavItem[]
}

/**
 * Espelha o menu/submenu do sistema legado (Default.aspx), reorganizado em grupos modernos.
 * Dashboard fica sempre em primeiro; os relatórios/BI ficam por último.
 */
export const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Cadastros',
    icon: FolderOpen,
    items: [
      { label: 'Clientes', to: '/clientes', icon: Users },
      { label: 'Usuários', to: '/usuarios', icon: UserCog },
      { label: 'Carrinhos', to: '/carrinhos', icon: Baby },
      { label: 'Tipos de Carrinho', to: '/tipos-carrinho', icon: Tag },
      { label: 'Empresa', to: '/empresa', icon: Building2 },
    ],
  },
  {
    label: 'Locação',
    icon: ShoppingBag,
    items: [
      // Entrega, devolução e troca acontecem na mesma tela: clicar numa locação em andamento abre devolver ou trocar.
      { label: 'Entrega e Devolução', to: '/locacao/entrega', icon: PackageCheck },
      { label: 'Locações', to: '/locacoes', icon: ClipboardList },
    ],
  },
  {
    label: 'Caixa',
    icon: Coins,
    items: [
      { label: 'Abertura', to: '/caixa/abertura', icon: Wallet },
      { label: 'Fechamento', to: '/caixa/fechamento', icon: Landmark },
      { label: 'Suprimento e Sangria', to: '/caixa/suprimento-sangria', icon: ArrowLeftRight },
      { label: 'Fluxo de Caixa', to: '/caixa/fluxo', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Relatórios & BI',
    icon: ChartColumn,
    items: [
      { label: 'Etiquetas', to: '/etiquetas', icon: Printer },
      { label: 'Relatório de Clientes', to: '/relatorios/clientes', icon: FileBarChart },
      { label: 'Histórico de Locações', to: '/relatorios/historico', icon: History },
    ],
  },
]
