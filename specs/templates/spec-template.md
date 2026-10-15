# Spec — <NNN> <Nome da feature>

| Campo | Valor |
| --- | --- |
| ID | `<NNN>-<slug>` |
| Branch | `feature/<NNN>-<slug>` |
| Status | Rascunho · Em revisão · Aprovada · Implementada |
| Autor | <nome> |
| Data | <AAAA-MM-DD> |

> A spec descreve **o quê** e **porquê**, nunca **como**. Nada de nomes de
> componentes, bibliotecas ou arquivos aqui. Isso vai no `plan.md`.

## 1. Contexto e problema

Qual é o problema do usuário? Por que agora? Que evidência temos?

## 2. Objetivos

- O1 —
- O2 —

### Fora de escopo

- 

## 3. Usuários e cenários

### História 1 — <título> (Prioridade: P1)

Como **<persona>**, quero **<ação>** para **<benefício>**.

**Critérios de aceite** (Dado / Quando / Então):

1. **Dado** <estado inicial>, **quando** <ação>, **então** <resultado observável>.
2. 

### História 2 — <título> (Prioridade: P2)

...

### Casos de borda

- O que acontece sem rede?
- O que acontece com lista vazia / dados muito longos?
- E no web vs. iOS vs. Android?

## 4. Requisitos funcionais

| ID | Requisito | História |
| --- | --- | --- |
| RF-01 | O sistema DEVE ... | H1 |
| RF-02 | O usuário DEVE poder ... | H1 |

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Desempenho: ... |
| RNF-02 | Acessibilidade: todo controle só com ícone tem `accessibilityLabel`. |
| RNF-03 | Plataformas: iOS, Android e web. |

## 6. Entidades (se houver dados)

- **<Entidade>**: o que representa, atributos principais, relações.

## 7. Critérios de sucesso

Mensuráveis e independentes de tecnologia.

- CS-01 —

## 8. Dúvidas em aberto

Marque cada ambiguidade com `[PRECISA ESCLARECER: ...]` no texto acima e liste aqui.
A spec só passa para **Aprovada** quando esta lista estiver vazia.

- [ ] 
