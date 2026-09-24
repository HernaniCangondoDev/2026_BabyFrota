# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Comprovantes impressos (balcão)

Entrega, troca e devolução imprimem um comprovante de bobina 80mm logo depois de registradas, como no sistema legado (só em tela de computador, não no celular). Ele também pode ser reimpresso em **Locações**, no detalhe de cada locação.

A impressão usa o navegador (`window.print()`), não a impressora do servidor, então funciona com a API em qualquer lugar. Para o ticket sair direto na térmica, sem abrir a janela de impressão a cada operação, configure o computador do balcão:

1. No Windows, instale o driver da térmica (Bematech MP-4000 ou MP-4200) e defina-a como **impressora padrão**.
2. Abra o Chrome com a opção `--kiosk-printing`. Exemplo de atalho:
   `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing http://localhost:5180`
   Feche todas as janelas do Chrome antes de abrir pelo atalho: a opção só vale numa instância nova.
3. Preencha **Cadastros > Empresa** (razão social e CNPJ), que saem no cabeçalho do comprovante. Sem isso, o ticket sai só com "Baby Frota".

Sem `--kiosk-printing` tudo funciona do mesmo jeito, mas o navegador mostra a janela de impressão a cada operação (um clique em Imprimir). A impressão de Etiquetas (folha A4) não muda: o formato de 80mm só é aplicado enquanto um comprovante está sendo impresso.
