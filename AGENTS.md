# AGENTS.md — Portfolio & Curriculo Giovanni Araujo Donegatti (GD // 26)

Este arquivo e a fonte de verdade arquitetural e operacional do repositorio `ODonegatti/ODonegatti`.
**Todo agente de IA deve ler este documento integralmente antes de criar, modificar ou refatorar qualquer arquivo.**

---

## 1. Contexto e Objetivo do Projeto

- **Produto:** Landing page de apresentacao pessoal (tratando o desenvolvedor como um produto de engenharia de precisao) que tambem atua como curriculo interativo.
- **Autor:** Giovanni Araujo Donegatti — Estudante de Analise e Desenvolvimento de Sistemas (ADS) no Instituto J&F (Germinatech), Ingles B2, foco em Back-End Java, Engenharia SQL (PostgreSQL) e Analise de Dados com IA.
- **Publico-alvo:** Recrutadores (estagio/junior em Back-End e Dados) e professores avaliadores do curso tecnico.
- **Estetica Oficial:** **Engenharia de Precisao Dark (Carbono, Titanio & Latao Tecnico)** — inspirada em Leica, Porsche Design, Linear e interfaces CAD/Swiss Grid. Zero marmore, zero neon exagerado, zero templates genericos.

---

## 2. Protocolo de Leitura Inicial (Onboarding do Agente)

Antes de propor planos ou escrever codigo, siga estritamente esta ordem:
1. Leia este `AGENTS.md` por completo.
2. Inspecione visualmente todas as 6 referencias em `docs/design-refs/` (`01` a `06`).
3. Verifique a secao **6. Correcoes Obrigatorias sobre os Prints** para nao replicar artefatos das imagens geradas.
4. Confirme em qual fase o usuario esta operando (**Fase 1: Base + Figma** ou **Fase 2: Modulo Three.js 3D**) antes de editar `js/black-widow-3d.js`.

---

## 3. Estrutura Oficial de Pastas

```text
ODonegatti/
├── AGENTS.md                        # Ponto de entrada obrigatorio para agentes (este arquivo)
├── README.md                        # Documentacao publica do repositorio
├── index.html                       # Estrutura HTML5 semantica + Bootstrap 5 + Modal Efficientia
├── assets/
│   ├── CV_Giovanni_Donegatti.pdf    # Curriculo para download direto (atributo download)
│   └── portrait.jpg                 # Retrato futuro (ate existir, manter slot PORTRAIT_SLOT_01)
├── css/
│   ├── tokens.css                   # :root (cores, fontes, escalas) e heranca tipografica base
│   ├── layout.css                   # Grid (Bento + Split), Flexbox, Display/Position e @media
│   └── effects.css                  # Especificidade sobre Bootstrap, ::before/::after, :hover e cards dos 8 nos
├── js/
│   ├── animations.js                # Scroll Reveal, Spotlight metalico, Typing e Contadores numericos
│   └── black-widow-3d.js            # [FASE 2] Cena Three.js procedural + projecao 3D -> variaveis CSS
└── docs/
    └── design-refs/
        ├── 01-hero.png              # Referencia visual: Navbar + Hero + PORTRAIT_SLOT_01
        ├── 02-ficha-tecnica.png     # Referencia visual: Bento Grid (Curriculo & Telemetria)
        ├── 03-efficientia.png       # Referencia visual: Case Flagship (Split Back-End & Dados)
        ├── 04-arsenal-viuva-negra.png # Referencia visual: Viuv. Negra CAD 3D + 8 nos + card hover
        ├── 05-footer.png            # Referencia visual: CTA final + Rodape de telemetria
        └── 06-modal-efficientia.png # Referencia visual: Modal Bootstrap de especificacoes tecnicas