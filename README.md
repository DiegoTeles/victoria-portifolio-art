# Portfólio Victoria Maria

Site de portfólio em React (Vite + TypeScript) com galeria, página Sobre, Contato e suporte a PT-BR/EN.

## Como adicionar suas artes

### 1. Coloque as imagens na pasta do projeto

Crie a pasta `public/images` na raiz do projeto e coloque lá os arquivos das obras (ex.: `public/images/obra-01.jpg`, `public/images/obra-02.png`).  
Formatos suportados: JPG, PNG, WebP. Use nomes que identifiquem a obra (ex.: `obra-01.jpg`).

### 2. Edite a lista de obras

Abra o arquivo **`src/data/artworks.ts`** e edite o array `artworks`.

Cada obra tem:

| Campo | Descrição |
|-------|-----------|
| **id** | Identificador único (ex.: `'obra-01'`). |
| **title** | Título em cada idioma: `{ 'pt-Br': '...', en: '...' }`. |
| **description** | Descrição em cada idioma: `{ 'pt-Br': '...', en: '...' }`. |
| **image** | Caminho da imagem a partir da raiz do site. Para arquivos em `public/images/`, use `/images/nome-do-arquivo.jpg`. |
| **orientation** | Proporção da imagem: `'square'` (quadrada), `'horizontal'` (paisagem) ou `'vertical'` (retrato). Ajuda no layout da galeria. |
| **pair** | Se duas obras devem aparecer lado a lado, use o **mesmo valor** nas duas (ex.: `'grupo-1'`). Obra sozinha: `null`. |
| **types** | Array de tipos: `'desenho'`, `'pintura'`, `'fotografia'`, `'arte-digital'`. Pode combinar, ex.: `['desenho', 'pintura']`. |

### Exemplo de uma obra

```ts
{
  id: 'obra-01',
  title: { 'pt-Br': 'Título da obra', en: 'Work title' },
  description: { 'pt-Br': 'Descrição em português.', en: 'Description in English.' },
  image: '/images/obra-01.jpg',
  orientation: 'vertical',
  pair: null,
  types: ['pintura'],
}
```

### Exemplo de par (duas obras lado a lado)

```ts
{
  id: 'obra-03',
  title: { 'pt-Br': 'Obra A', en: 'Work A' },
  description: { 'pt-Br': '...', en: '...' },
  image: '/images/obra-03.jpg',
  orientation: 'vertical',
  pair: 'grupo-1',
  types: ['fotografia'],
},
{
  id: 'obra-04',
  title: { 'pt-Br': 'Obra B', en: 'Work B' },
  description: { 'pt-Br': '...', en: '...' },
  image: '/images/obra-04.jpg',
  orientation: 'vertical',
  pair: 'grupo-1',
  types: ['fotografia'],
}
```

As duas obras com o mesmo `pair` aparecem juntas na galeria. O `orientation` deve refletir a proporção real da imagem para o layout ficar correto.

### Resumo rápido

1. Criar **`public/images`** e colocar as imagens.
2. Em **`src/data/artworks.ts`**, substituir ou estender o array `artworks` com objetos no formato acima, usando `image: '/images/seu-arquivo.jpg'` e os tipos/títulos/descrições que quiser.

---

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## React + TypeScript + Vite

This project uses React with Vite and TypeScript. For ESLint and React Compiler details, see the [Vite template documentation](https://vite.dev/guide/).
