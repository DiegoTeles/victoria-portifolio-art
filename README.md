# Portfólio Victoria Maria

Site de portfólio em React (Vite + TypeScript) com galeria, página Sobre, Contato e suporte a PT-BR/EN.

## Como adicionar suas artes

### 1. Coloque as imagens na pasta do projeto

Crie a pasta `public/images` na raiz do projeto e coloque lá os arquivos das obras (ex.: `public/images/obra-01.jpg`, `public/images/obra-02.png`).  
Formatos suportados: JPG, PNG, WebP. Use nomes que identifiquem a obra (ex.: `obra-01.jpg`).

### 2. Edite o JSON de obras

As obras vêm do arquivo **`src/data/artworks.json`**: um array JSON em que cada item é uma obra. Assim você controla títulos, descrições, ordem, grupos e tipos só editando o JSON.

Cada objeto do array tem:

| Campo | Descrição |
|-------|-----------|
| **id** | Identificador único (ex.: `"painting-01"`). |
| **order** | Número que define a ordem de exibição na galeria (menor = primeiro). |
| **title** | Objeto com `"pt-Br"` e `"en"` (título em cada idioma). Use `*texto*` para exibir parte em itálico (ex.: `"No *clube*, 2022."`). |
| **description** | Objeto com `"pt-Br"` e `"en"` (descrição em cada idioma). Use `*texto*` para itálico. |
| **image** | Caminho da imagem a partir da raiz do site (ex.: `"/images/painting/painting-01.png"`). |
| **orientation** | `"square"`, `"horizontal"` ou `"vertical"`. |
| **group** | Se **2 a 5** obras devem aparecer juntas, use o **mesmo valor** em todas (ex.: `"serie-1"`). Obra sozinha: `null`. As obras do grupo devem estar **em sequência** no array. |
| **types** | Array de strings (sempre em inglês): `"drawing"`, `"painting"`, `"photography"`, `"digital-art"`. Pode combinar. |

### Exemplo de entrada no JSON

```json
{
  "id": "painting-01",
  "order": 1,
  "title": { "pt-Br": "Meu título", "en": "My title" },
  "description": { "pt-Br": "Descrição.", "en": "Description." },
  "image": "/images/painting/painting-01.png",
  "orientation": "square",
  "group": null,
  "types": ["painting"]
}
```

### Grupo de 2 a 5 obras

Para exibir várias obras juntas, use o **mesmo `group`** em todas e coloque-as **em sequência** no array. O grupo exibe **uma única legenda** para todas as imagens: use o **título e a descrição do primeiro item** do grupo como legenda do grupo (os demais podem ter título/descrição vazios).

```json
{"id": "painting-01", "title": {"pt-Br": "Painel 1", "en": "Panel 1"}, "description": {"pt-Br": "", "en": ""}, "image": "/images/painting/painting-01.png", "orientation": "square", "group": "triptico-1", "types": ["painting"]},
{"id": "painting-02", "title": {"pt-Br": "Painel 2", "en": "Panel 2"}, "description": {"pt-Br": "", "en": ""}, "image": "/images/painting/painting-02.png", "orientation": "square", "group": "triptico-1", "types": ["painting"]},
{"id": "painting-03", "title": {"pt-Br": "Painel 3", "en": "Panel 3"}, "description": {"pt-Br": "", "en": ""}, "image": "/images/painting/painting-03.png", "orientation": "square", "group": "triptico-1", "types": ["painting"]}
```

### Resumo rápido

1. Coloque as imagens em **`public/images`** (e subpastas se quiser).
2. Edite **`src/data/artworks.json`**: array de objetos no formato acima. A ordem do array define a ordem na galeria.

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
