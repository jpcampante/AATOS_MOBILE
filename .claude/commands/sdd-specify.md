---
description: SDD etapa 1 — cria a spec de uma nova feature a partir de uma descrição
argument-hint: <descrição da feature>
---

Crie a especificação de uma nova feature seguindo o Spec-Driven Development deste repositório.

Descrição da feature: $ARGUMENTS

Passos:

1. Leia `specs/README.md`, `specs/constitution.md` e `specs/000-baseline/spec.md`.
2. Descubra o próximo número livre em `specs/` (três dígitos) e crie um slug curto em kebab-case.
3. Crie a branch `feature/NNN-slug` a partir de `develop` (se houver mudanças não commitadas, pare e pergunte).
4. Copie `specs/templates/spec-template.md` para `specs/NNN-slug/spec.md` e preencha.
   - Fale de **o quê** e **porquê**; nada de componentes, bibliotecas ou arquivos.
   - Critérios de aceite no formato Dado / Quando / Então, testáveis.
   - Tudo que não estiver claro na descrição vira `[PRECISA ESCLARECER: pergunta]`, no máximo 5; para o resto, assuma o padrão razoável e registre a suposição.
5. Mostre as dúvidas em aberto ao usuário e atualize a spec com as respostas.
6. Não escreva código nem o plano nesta etapa.
