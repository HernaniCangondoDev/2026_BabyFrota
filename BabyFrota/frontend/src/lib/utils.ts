import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AxiosError } from 'axios'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extrai a mensagem de negócio devolvida pelo backend (ProblemDetails.detail, via ApiExceptionHandler)
 * para exibir em toasts/alertas de erro. Cai para uma mensagem genérica quando não há detalhe da API.
 */
export function extrairMensagemErro(err: unknown, mensagemPadrao = 'Não foi possível concluir a operação.'): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.detail ?? err.response?.data?.title ?? mensagemPadrao
  }
  return mensagemPadrao
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
