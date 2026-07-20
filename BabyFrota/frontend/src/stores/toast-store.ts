import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  variant: ToastVariant
  title: string
  description?: string
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: number) => void
}

let proximoId = 1
const DURACAO_MS = 5000

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = proximoId++
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, DURACAO_MS)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

/**
 * API imperativa para disparar notificações de qualquer lugar (fora de componentes React também).
 * Uso: toast.success('Cliente salvo com sucesso.')
 */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().addToast({ variant: 'success', title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().addToast({ variant: 'error', title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().addToast({ variant: 'info', title, description }),
}
