# Monrion Portfolio — CLAUDE.md

## Visão Geral do Projeto

Portfolio pessoal de Monrion. Site estático em HTML/CSS/JS puro — sem framework, sem build step.
Idioma do conteúdo: **Português de Portugal**.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Markup | HTML5 (`index.html`) |
| Estilos | Tailwind CSS via CDN + `<style type="text/tailwindcss">` inline |
| Animações | GSAP 3 + ScrollTrigger (via `importmap`) |
| 3D / Globe | Three.js (via `importmap`) — `src/globe.js` |
| Ícones | Lucide (via `importmap`) |
| Lógica JS | `src/main.js` (ES modules) |
| Fontes | Google Fonts |

### Import Map (sem bundler)
```json
{
  "three": "https://esm.sh/three@0.160.0",
  "gsap": "https://esm.sh/gsap@3.12.5",
  "gsap/ScrollTrigger": "https://esm.sh/gsap@3.12.5/ScrollTrigger",
  "lucide": "https://esm.sh/lucide@0.344.0"
}
```

---

## Sistema de Design — Midnight Luxe

### Paleta
| Token | Hex | Uso |
|---|---|---|
| `ink` / Obsidian | `#0D0D12` | Fundo principal, cards escuros |
| `paper` / Ivory | `#FAF8F5` | Texto claro, fundos secções claras |
| `silver` | `#8C8C8C` | Texto secundário |
| `carbon` / Slate | `#2A2A35` | Fundo navbar, superfícies intermédias |
| Champagne (accent) | `#C9A84C` | CTAs, destaques, hover states |

### Tipografia
| Role | Fonte |
|---|---|
| Headings / Sans | `Plus Jakarta Sans` (400–700) |
| Drama / Serif | `Cormorant Garamond` Italic |
| Monospace / Data | `IBM Plex Mono` |

### Raios
- Containers: `rounded-2xl` (2rem) a `rounded-3xl` (3rem)
- Navbar pill: `rounded-full`

---

## Estrutura de Ficheiros

```
Portfolio/
├── index.html          ← Página única completa
├── CLAUDE.md           ← Este ficheiro
├── GEMINI.md           ← Prompt de referência do agente de design
├── assets/
│   ├── favicon.ico     ← Ícone multi-tamanho (16/32/48/64/128/256px)
│   └── favicon.svg     ← Versão SVG vetorial do logo M
└── src/
    ├── main.js         ← Lógica principal: GSAP, ScrollTrigger, interações
    └── globe.js        ← Globe 3D em Three.js
```

---

## Convenções de Código

- **Sem TypeScript, sem JSX, sem bundler.** Tudo vanilla JS ES modules.
- Animações GSAP iniciam sempre com `gsap.context()` e fazem `ctx.revert()` no cleanup.
- Easing padrão: `power3.out` (entradas) / `power2.inOut` (morphs).
- Stagger: `0.08` para texto, `0.15` para cards/containers.
- Interações de botão: `scale(1.03)` hover com `cubic-bezier(0.25, 0.46, 0.45, 0.94)`.

---

## Logo e Favicon

- **SVG:** `assets/favicon.svg` — monograma "M" geométrico em Champagne `#C9A84C` sobre fundo Obsidian `#0D0D12` com cantos arredondados.
- **ICO:** `assets/favicon.ico` — gerado com Pillow (Python), inclui tamanhos 16/32/48/64/128/256px.
- O `index.html` referencia ambos: ICO como fallback, SVG como preferência para browsers modernos.

---

## Comandos Úteis

```bash
# Abrir localmente (sem servidor)
open index.html

# Servir com Python (recomendado para testar importmap)
python -m http.server 8080

# Regenerar favicon.ico a partir do SVG (requer Pillow)
python scripts/gen_favicon.py
```

---

## Notas para o Agente

- **Não criar ficheiros de build** (package.json, vite.config, webpack, etc.) — o projeto é intencionalmente sem build step.
- **Não adicionar frameworks** (React, Vue, etc.) sem pedido explícito.
- **Manter o idioma PT-PT** em todo o conteúdo visível.
- Antes de editar `index.html`, ler as secções relevantes — o ficheiro tem ~500+ linhas.
- O `globe.js` é independente do resto; não o modificar sem necessidade.
- Imagens externas usam Unsplash URLs reais (não placeholders).
