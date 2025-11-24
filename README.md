# MeuHackerMachine

Plataforma de desafios de programacao estilo HackerRank, focada em exercicios de manipulacao de dados e consultas a REST APIs. Os usuarios resolvem problemas com execucao de codigo em tempo real, validacao automatica de testes e sistema de pontuacao.

## Tecnologias Utilizadas

### Frontend

| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| React | 18.2 | Biblioteca para construcao de interfaces |
| TypeScript | 5.3 | Superset tipado de JavaScript |
| Vite | 5.0 | Build tool com hot reload |
| Monaco Editor | - | Editor de codigo do VS Code |
| Axios | - | Cliente HTTP |
| React Resizable Panels | - | Paineis redimensionaveis |
| Marked | - | Renderizador de Markdown |

### Backend

| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| Node.js | - | Runtime JavaScript |
| Express | 4.18 | Framework web minimalista |
| TypeScript | 5.3 | Tipagem estatica |
| VM2 | 3.9 | Execucao de codigo em sandbox isolado |
| Faker.js | 8.3 | Geracao de dados falsos deterministicos |
| Chance.js | 1.1 | Biblioteca de randomizacao |
| ts-node-dev | - | Runtime TypeScript com hot reload |

### Infraestrutura

| Tecnologia | Descricao |
|------------|-----------|
| Docker | Containerizacao |
| Docker Compose | Orquestracao de multiplos containers |
| Nginx | Proxy reverso |

## Funcionalidades

### Editor de Codigo
- Integracao com Monaco Editor (mesmo editor do VS Code)
- Syntax highlighting para TypeScript
- IntelliSense e autocompletar
- Auto-save no armazenamento de sessao

### Sistema de Testes
- Casos de teste visiveis e ocultos
- Execucao em sandbox isolado via VM2
- Transpilacao de TypeScript em tempo real
- Controle de timeout por teste
- Medicao de tempo de execucao

### Motor de API Mock
- Geracao dinamica de endpoints a partir da configuracao do exercicio
- Suporte a paginacao com tamanhos configuraveis
- Filtragem por query parameters
- Dados gerados com seed para consistencia
- Isolamento de dados por endpoint

### Gerenciamento de Exercicios
- Definicoes baseadas em JSON
- Niveis de dificuldade (facil/medio/dificil)
- Sistema de pontuacao
- Templates de assinatura de funcao
- Codigo inicial pre-definido
- Sistema de dicas

### Painel de Resultados
- Interface com abas (Testes/Console/Execucao Manual)
- Indicadores visuais de sucesso/falha
- Captura de saida do console
- Execucao manual com argumentos customizados
- Formatacao estilo terminal

## Arquitetura

```
FRONTEND (Vite + React + Monaco)
         |
         v
     NGINX (Proxy Reverso)
         |
         v
BACKEND (Express + TypeScript)
    |-- ExerciseLoader (Carregamento de JSONs)
    |-- MockApiEngine (Geracao dinamica de endpoints)
    |-- FakerDB (Armazenamento in-memory com seed)
    |-- TestRunner (Execucao em sandbox VM2)
    +-- Routes (Endpoints REST)
         |
         v
   VM2 Sandbox (Ambiente de execucao isolado)
```

## Estrutura do Projeto

```
challenges/
├── backend/                    # Backend Express + TypeScript
│   ├── src/
│   │   ├── index.ts           # Inicializacao do servidor
│   │   ├── services/          # Logica de negocio
│   │   │   ├── ExerciseLoader.ts
│   │   │   ├── FakerDB.ts
│   │   │   ├── MockApiEngine.ts
│   │   │   └── TestRunner.ts
│   │   ├── routes/            # Endpoints da API
│   │   └── types/             # Interfaces TypeScript
│   └── package.json
│
├── frontend/                   # Frontend React + Vite
│   ├── src/
│   │   ├── App.tsx            # Componente principal
│   │   ├── components/        # Componentes React
│   │   │   ├── ExerciseSelector.tsx
│   │   │   ├── MonacoEditor.tsx
│   │   │   ├── TabbedResultsPanel.tsx
│   │   │   ├── TerminalTestResults.tsx
│   │   │   ├── ManualRunModal.tsx
│   │   │   └── QuestionPanel.tsx
│   │   ├── services/          # Cliente API
│   │   └── types/             # Interfaces TypeScript
│   └── package.json
│
├── exercises/                  # Definicoes de exercicios (JSON)
│   ├── weather-analysis.json
│   ├── food-outlets.json
│   ├── books-by-author.json
│   ├── hotel-bookings.json
│   └── [mais exercicios...]
│
├── nginx/                      # Configuracao do Nginx
├── docker-compose.yml          # Orquestracao de containers
└── run.sh                      # Script de inicializacao
```

## Como Executar

### Com Docker (Recomendado)

```bash
# Iniciar todos os servicos
./run.sh

# Ou manualmente
docker-compose up --build
```

### Desenvolvimento Local

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

### Endpoints

| Servico | URL | Descricao |
|---------|-----|-----------|
| Frontend | http://localhost:3000 | Interface do usuario |
| Backend API | http://localhost:3001/api | API REST |
| Health Check | http://localhost:3001/health | Status do servidor |

## Exercicios Disponiveis

| Exercicio | Dificuldade | Descricao |
|-----------|-------------|-----------|
| weather-analysis | Medio | Filtrar dados meteorologicos por faixa de temperatura |
| food-outlets | Medio | Buscar restaurantes por cidade e custo maximo |
| books-by-author | Medio | Filtrar livros por autor e numero de paginas |
| hotel-bookings | Medio | Pesquisar hoteis por cidade e preco |
| employee-salary-filter | Facil | Filtrar funcionarios por faixa salarial |
| github-repos | Medio | Consultar repositorios por linguagem e estrelas |
| high-rated-movies | Facil | Filtrar filmes por avaliacao |
| top-products | Facil | Encontrar produtos mais vendidos |
| stock-prices | Medio | Analisar dados do mercado de acoes |
| most-active-authors | Medio | Encontrar autores mais ativos |
| user-activity-stats | Medio | Analisar metricas de atividade de usuarios |

## Decisoes Tecnicas

### Geracao de Dados Deterministicos
Faker.js com seeds fixos garante resultados consistentes entre execucoes, permitindo que usuarios depurem com dados previsiveis.

### Implementacao de Fetch Interno
O TestRunner intercepta chamadas fetch e as redireciona diretamente para o FakerDB, evitando requisicoes HTTP externas durante os testes.

### Execucao em Sandbox
VM2 fornece isolamento para codigo de usuario nao confiavel. TypeScript e transpilado para JavaScript antes da execucao.

### API Dirigida por Schema
Todos os endpoints mock sao auto-gerados a partir das definicoes JSON dos exercicios, com template de geracao de dados.

## Licenca

Este projeto e privado e destinado a fins educacionais.
