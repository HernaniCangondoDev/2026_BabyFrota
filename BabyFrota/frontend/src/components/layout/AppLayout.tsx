import { Outlet } from 'react-router-dom'
import { MobileSidebar, Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ComprovanteHost } from '@/components/locacao/ComprovanteHost'
import { Toaster } from '@/components/ui/toaster'

export function AppLayout() {
  return (
    <div className="flex h-svh w-full overflow-hidden">
      <Sidebar />
      <MobileSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6 print:overflow-visible print:bg-white print:p-0">
          <Outlet />
        </main>
      </div>
      <Toaster />
      <ComprovanteHost />
    </div>
  )
}
