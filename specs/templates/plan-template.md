# Plan — <NNN> <Nome da feature>

| Campo | Valor |
| --- | --- |
| Spec | [spec.md](./spec.md) |
| Status | Rascunho · Aprovado |
| Data | <AAAA-MM-DD> |

> O plano descreve **como** a spec será implementada neste código.
> Toda decisão aqui precisa respeitar a [constituição](../constitution.md).

## 1. Resumo técnico

Duas ou três frases com a abordagem.

## 2. Verificação da constituição

| Princípio | Atende? | Observação |
| --- | --- | --- |
| I. Spec primeiro | ☐ | |
| II. Android primeiro | ☐ | |
| III. Design system | ☐ | |
| IV. Dados por trás de uma camada | ☐ | |
| V. Acessibilidade | ☐ | |
| VI. Qualidade verificável | ☐ | |
| VII. Simplicidade | ☐ | |

Qualquer violação precisa de justificativa na seção 8.

## 3. Arquitetura

- Telas / componentes afetados (`src/...`):
- Estado (hooks, reducers, contexto):
- Dados (tipos em `src/data` ou `src/features/<area>/types.ts`, serviços):
- APIs de dispositivo (câmera, microfone, haptics...) e o comportamento no Android:

## 4. Modelo de dados

```ts
// tipos novos ou alterados
```

## 5. Contratos (APIs / serviços)

| Operação | Entrada | Saída | Erros |
| --- | --- | --- | --- |

## 6. Estratégia de testes

- Unitário:
- Componente:
- Manual (emulador Android / Expo Go):

## 7. Riscos e alternativas consideradas

- 

## 8. Exceções à constituição

| Princípio | Por que é necessário | Alternativa mais simples rejeitada porque |
| --- | --- | --- |
