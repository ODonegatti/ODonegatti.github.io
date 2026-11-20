# GD // 26 — Giovanni Araujo Donegatti

**Portfólio Técnico & Currículo Interativo** desenvolvido sob a estética **Engenharia de Precisão Dark** (Carbono, Titânio & Latão Técnico), inspirado em interfaces CAD, Swiss Grid, Leica e Porsche Design.

> **Demo Online (GitHub Pages):** https://odonegatti.github.io

---

## Sobre o Projeto

Esta landing page apresenta o perfil técnico de **Giovanni Araujo Donegatti** — estudante do Ensino Médio Técnico em **Análise e Desenvolvimento de Sistemas (ADS)** no **Instituto J&F (Germinatech)** (2026 – 2028), com foco em **Back-End Java**, **Engenharia SQL (PostgreSQL)** e **Análise de Dados com IA**.

Além de portfólio interativo, a página atua como currículo completo com **visualização direta do PDF na página (sem download obrigatório)** e opção de **download direto em PDF**.

---

## Arquitetura das Seções

1. **01 // Hero & `PORTRAIT_SLOT_01`**
   - Status operacional (`SYS_MODEL: GD-2026`), efeito de digitação (*typing*) no subtítulo técnico, barra de telemetria rápida e moldura CAD com cantoneiras de latão exibindo o retrato otimizado em fundo dark studio.
   - Ações principais: **Baixar Currículo (PDF)**, **Visualizar CV (modal de leitura sem download)**, **Explorar GitHub** e controle antecipado do **Modo Sem Aranha (Aviso de Aracnofobia)**.
2. **02 // Ficha Técnica & Formação (Bento Grid)**
   - Cards assimétricos com efeito *spotlight* metálico reativo ao cursor: `CORE_ENGINE`, `ACADEMIC_SPEC` (Instituto J&F — Germinatech, 2026 – 2028), `LANGUAGE_LEVEL` (Inglês B2) e `TELEMETRY_METRICS` com contadores animados (`240h+`, `13` entidades PostgreSQL, `< 5ms` HikariCP, `08` módulos no arsenal).
3. **03 // Case Flagship — Efficientia**
   - Layout dividido em dois pilares (**Back-End & Cloud** e **Dados, SQL & IA Governada**) conectados por uma régua vetorial SVG em latão, acompanhado de **Modal Bootstrap 5** detalhando as 13 tabelas relacionais, blindagem LGPD (`PBKDF2WithHmacSHA512`, `SHA-256`, `AuthFilter`) e pipeline cloud (`Maven → Docker Tomcat 11 → Render Cloud → Aiven PostgreSQL 14+`).
4. **04 // O Arsenal Técnico (Viúva Negra 3D + 8 Nós)**
   - Modelo procedural em **Three.js** (fibra de carbono facetada, juntas em latão, ampulheta rubi exclusiva `#C81E3A`, descida animada na teia graduada e paralaxe suave).
   - **Projeção 3D → CSS:** as pontas das 8 patas projetam suas coordenadas em tempo real nas variáveis CSS `--pata-1-x/y` .. `--pata-8-x/y`, mantendo todas as inspeções e tooltips **100% em CSS puro** (`:hover`, `:focus-visible`, `:focus-within`).
   - **Acessibilidade & Fallback:** botão **Aviso de Aracnofobia** (sincronizado entre o Hero e a Seção 04) que substitui a aranha por um núcleo geométrico CAD limpo (`SAFE_MODE`), suporte a `prefers-reduced-motion` e modo estático SVG via `?static=1`.
5. **05 // Aquisição, Contato & Rodapé de Telemetria**
   - CTA final com download e visualização do currículo, navegação rápida, links para repositórios e status operacional.

---

## Sistema de Design & Decisões Técnicas

| Camada | Arquivo | Responsabilidade |
| :--- | :--- | :--- |
| **Tokens** | [`css/tokens.css`](css/tokens.css) | Variáveis `:root` (paleta Carbono `#09090B`, Chassi `#111114`, Titânio `#F4F4F5`, Latão `#D9A441`, Esmeralda `#10B981`, Rubi `#C81E3A`), escala tipográfica fluida (`clamp`) e sobrescrita limpa de tokens do Bootstrap 5. |
| **Estrutura** | [`css/layout.css`](css/layout.css) | CSS Grid (Hero assimétrico, Bento Grid, Split Grid), Flexbox, responsividade (`1440px` → Tablet → Mobile `390px`) e modais. |
| **Efeitos** | [`css/effects.css`](css/effects.css) | Sobrescrita controlada sobre Bootstrap 5 (sem `!important`), dot-grid CAD via `::before`/`::after`, cantoneiras de latão, spotlight metálico e tooltips 100% CSS dos 8 nós. |
| **Animações** | [`js/animations.js`](js/animations.js) | Scroll Reveal progressivo (`IntersectionObserver`), spotlight metálico, efeito *typing*, contadores numéricos e régua lateral `SCROLL_CALIBRATION`. |
| **3D Procedural** | [`js/black-widow-3d.js`](js/black-widow-3d.js) | Cena WebGL em Three.js com iluminação procedural (`PMREM`), projeção 3D → variáveis CSS e controle sincronizado do Modo Sem Aranha. |

### Tecnologias Utilizadas

- **Marcação & Estilo:** HTML5 Semântico, CSS3 (Custom Properties, Grid, Flexbox, Media Queries), Bootstrap 5.3.3
- **Interatividade & 3D:** JavaScript (ES6+), Three.js `r147` (UMD)
- **Tipografia:** Space Grotesk, Inter e JetBrains Mono (Google Fonts)
- **SEO & Compartilhamento:** Favicon vetorial SVG, Open Graph e Twitter Cards

---

## Estrutura do Repositório

```text
ODonegatti.github.io/
├── index.html                        # Estrutura HTML5 semântica + Modais (Efficientia e Visualizador CV)
├── README.md                         # Documentação do projeto
├── LICENSE                           # Licença MIT
├── AGENTS.md                         # Diretrizes arquiteturais do repositório
├── assets/
│   ├── CV_Giovanni_Donegatti.pdf     # Currículo técnico oficial (visualização inline e download)
│   ├── favicon.svg                   # Favicon vetorial GD // 26
│   └── portrait.jpg                  # Retrato otimizado em fundo dark studio
├── css/
│   ├── tokens.css                    # Design tokens e herança tipográfica
│   ├── layout.css                    # Arquitetura estrutural e responsividade
│   └── effects.css                   # Efeitos visuais, CAD overlays e tooltips CSS puros
├── js/
│   ├── animations.js                 # Scroll reveal, spotlight, typing, contadores e telemetria
│   └── black-widow-3d.js             # Cena Three.js procedural + Modo Aracnofobia
└── docs/
    └── design-refs/                  # Referências visuais das telas do projeto
```

---

## Visualização Local

Como o projeto é 100% estático (sem etapas de build obrigatórias), você pode executar um servidor local simples na raiz do repositório:

```bash
# Usando Python 3
python -m http.server 8000
```

Depois, abra no navegador:

- **Versão completa (com Three.js 3D):** `http://localhost:8000`
- **Modo estático (SVG CAD sem WebGL):** `http://localhost:8000/?static=1`

---

## Contato

- **GitHub:** [github.com/ODonegatti](https://github.com/ODonegatti)
- **Projeto Flagship:** [Efficientia-servlet](https://github.com/Efficientia/Efficientia-servlet)
- **E-mail:** [gigi.donegatti@gmail.com](mailto:gigi.donegatti@gmail.com)

---

## Licença

Distribuído sob a licença **MIT**. Veja [`LICENSE`](LICENSE) para mais informações.
