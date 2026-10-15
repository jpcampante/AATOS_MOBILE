---
description: SDD etapa 2 — gera o plano técnico de uma spec aprovada
argument-hint: <NNN ou NNN-slug>
---

Gere o plano técnico da feature `$ARGUMENTS`.

Passos:

1. Abra `specs/$ARGUMENTS*/spec.md`. Se ainda houver `[PRECISA ESCLARECER]`, pare e peça as respostas.
2. Leia `specs/constitution.md` e as partes de `src/` que a feature toca (use `specs/000-baseline/plan.md` como mapa do código).
3. Se a feature usa APIs do Expo, confira a documentação da versão do SDK instalada (`node_modules/expo/package.json`) antes de decidir.
4. Copie `specs/templates/plan-template.md` para `plan.md` na mesma pasta e preencha.
   - Preencha a verificação da constituição com honestidade; violações vão para a seção 8 com justificativa.
   - Cite os arquivos reais que serão criados ou alterados.
5. Apresente o resumo e os riscos ao usuário. Não escreva código nesta etapa.
