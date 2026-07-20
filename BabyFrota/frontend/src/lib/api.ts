import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth-store'

// A API .NET pode estar a correr em portas diferentes conforme o perfil de arranque
// usado no Visual Studio: "https"/Kestrel (5025 http / 7017 https) ou "IIS Express" (44372).
// Para não obrigar a trocar o .env sempre que o perfil muda, guardamos qual porta respondeu
// por último (nesta aba do browser) e tentamos a outra automaticamente se a primeira falhar
// por erro de rede (ex.: ERR_CONNECTION_REFUSED porque a API está no outro perfil).
const PRIMARY_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5025/api'
const FALLBACK_URL = import.meta.env.VITE_API_URL_FALLBACK ?? 'https://localhost:44372/api'

const STORAGE_KEY = 'bf_api_base_url'

function baseUrlAtual(): string {
  return sessionStorage.getItem(STORAGE_KEY) ?? PRIMARY_URL
}

function lembrarBaseUrl(url: string) {
  sessionStorage.setItem(STORAGE_KEY, url)
}

export const api = axios.create({
  baseURL: baseUrlAtual(),
  // Sem isto, uma requisição que trava do lado do servidor (ex.: query pesada) nunca falha —
  // fica "pendente" indefinidamente. Como o navegador limita o nº de conexões simultâneas por
  // origem (~6), algumas poucas chamadas penduradas bastam para "engasgar" o resto do app inteiro
  // (todas as outras páginas ficam esperando uma conexão livre = parecem carregar para sempre).
  timeout: 25_000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface ConfigComRetry extends InternalAxiosRequestConfig {
  _tentouUrlAlternativa?: boolean
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }

    const config = error.config as ConfigComRetry | undefined

    // Sem "response" = a requisição nem chegou a um servidor (porta errada, API caída, etc.).
    // Se ainda não tentámos a URL alternativa, troca e repete a chamada uma única vez.
    // Importante: um timeout (error.code === 'ECONNABORTED') também não tem "response", mas nesse
    // caso o servidor certo respondeu devagar — trocar de porta não ajuda e só dobra a espera.
    const semResposta = !error.response && error.code !== 'ECONNABORTED'
    const urlAlternativa = api.defaults.baseURL === PRIMARY_URL ? FALLBACK_URL : PRIMARY_URL

    if (semResposta && config && !config._tentouUrlAlternativa) {
      config._tentouUrlAlternativa = true
      config.baseURL = urlAlternativa
      api.defaults.baseURL = urlAlternativa
      lembrarBaseUrl(urlAlternativa)
      return api(config)
    }

    return Promise.reject(error)
  },
)
