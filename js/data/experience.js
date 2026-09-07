import { L } from '../i18n.js';

export const experience = [
  {
    key: 'collective',
    org: 'Collective Health',
    logo: 'assets/collective.webp',
    role: L('Senior React Native Engineer', 'Engenheiro React Native Sênior'),
    period: '01/2026 · 2026',
    bullets: [
      L(
        "Built the team's first end-to-end test framework from zero: Maestro with 32 flows across 11 feature areas and a Node mock server (26+ routes) that made full auth testing runnable on the Android emulator.",
        'Construí o primeiro framework de testes ponta a ponta do time do zero: Maestro com 32 fluxos em 11 áreas e um servidor mock em Node (26+ rotas) que tornou o teste completo de autenticação possível no emulador Android.'
      ),
      L(
        'Wired the suite into nightly iOS and Android CI, cutting warm Android runs from 75 to 16 minutes, plus an automated pass-rate and flake report for non-technical stakeholders.',
        'Liguei a suíte a um CI noturno no iOS e Android, cortando as execuções do Android de 75 para 16 minutos, com um relatório automático de aprovação e flakes para quem não é técnico.'
      ),
      L(
        'Shipped three regression-blocking PR quality gates (TypeScript, ESLint, commit and branch conventions) with a baseline-ratchet design that stops new errors without blocking the backlog.',
        'Entreguei três quality gates de PR que bloqueiam regressões (TypeScript, ESLint, convenções de commit e branch) com um design baseline-ratchet que barra erros novos sem travar o backlog.'
      )
    ],
    tags: ['React Native', 'TypeScript', 'Maestro', 'Fabric', 'TurboModules', 'React Compiler', 'GitHub Actions']
  },
  {
    key: 'pluma',
    org: L('Fintech Freelance', 'Fintech Freelance'),
    logo: 'assets/pluma.webp',
    role: L('Fullstack Developer', 'Desenvolvedor Fullstack'),
    period: '03/2026 · 2026',
    bullets: [
      L(
        'Shipped Pluma Finance, a personal-finance iOS app, from zero to production with React Native and Expo.',
        'Publiquei o Pluma Finance, um app de finanças pessoais para iOS, do zero à produção com React Native e Expo.'
      ),
      L(
        'Built Supabase auth (PKCE, TOTP 2FA) and Open Finance with Pluggy, on a network-aware tRPC and TanStack Query data layer.',
        'Construí auth Supabase (PKCE, 2FA TOTP) e Open Finance com Pluggy, sobre uma camada de dados tRPC e TanStack Query atenta à rede.'
      ),
      L(
        'Delivered a native iOS Liquid Glass UI with Reanimated, RevenueCat subscriptions, Sentry, and a full EAS Build and OTA pipeline on GitHub Actions, tested with Jest and Maestro.',
        'Entreguei uma UI nativa iOS Liquid Glass com Reanimated, assinaturas RevenueCat, Sentry, e um pipeline completo EAS Build e OTA no GitHub Actions, testado com Jest e Maestro.'
      )
    ],
    tags: ['React Native', 'Expo', 'EAS', 'Supabase', 'RevenueCat', 'Sentry']
  },
  {
    key: 'ploomes',
    org: 'Ploomes',
    logo: 'assets/ploomes.webp',
    role: L('Mobile Developer', 'Desenvolvedor Mobile'),
    period: '05/2023 · 01/2026',
    bullets: [
      L(
        'Built a solid offline architecture with RealmDB and OData, cutting support tickets by 90% and keeping reliable sync in low-connectivity places.',
        'Construí uma arquitetura offline sólida com RealmDB e OData, cortando os tickets de suporte em 90% e mantendo sincronização confiável em locais de baixa conectividade.'
      ),
      L(
        'Improved core flows with React Native, Reanimated and Gesture Handler for CRUD, charts and maps.',
        'Melhorei os fluxos principais com React Native, Reanimated e Gesture Handler para CRUD, gráficos e mapas.'
      ),
      L(
        'Created an offline-cached universal search handling 30+ queries per user a day for more than 5,000 active users.',
        'Criei uma busca universal com cache offline que aguenta 30+ consultas por usuário por dia para mais de 5.000 usuários ativos.'
      )
    ],
    tags: ['React Native', 'TypeScript', 'RealmDB', 'Jest', 'Maestro', 'Bitrise', 'CodePush']
  },
  {
    key: 'agrolite',
    org: 'Agrolite',
    logo: 'assets/agrolite.webp',
    role: L('Mobile Developer', 'Desenvolvedor Mobile'),
    period: '01/2021 · 05/2023',
    bullets: [
      L(
        'Built an offline-first architecture for the Farm Operations app in Kotlin, with full offline use and reliable sync.',
        'Construí uma arquitetura offline-first para o app de Operações da Fazenda em Kotlin, com uso totalmente offline e sincronização confiável.'
      ),
      L(
        'Connected proprietary farm hardware in real time with custom Bluetooth and WebSocket native modules.',
        'Conectei hardware agrícola proprietário em tempo real com módulos nativos de Bluetooth e WebSocket sob medida.'
      ),
      L(
        'Rebuilt the home dashboard in React Native with charts, goal tracking and camera grids, raising app usage by 22%.',
        'Refiz o dashboard inicial em React Native com gráficos, acompanhamento de metas e grid de câmeras, aumentando o uso do app em 22%.'
      )
    ],
    tags: ['React Native', 'Kotlin', 'Reanimated', 'Firebase', 'AWS']
  },
  {
    key: 'freelance',
    org: 'Freelance',
    logo: null,
    role: L('Fullstack Developer', 'Desenvolvedor Fullstack'),
    period: '06/2020 · 01/2021',
    bullets: [
      L(
        'Built mobile apps for small companies and early-stage startups with React Native and TypeScript, turning product ideas into apps ready for the market.',
        'Construí apps mobile para pequenas empresas e startups iniciantes com React Native e TypeScript, transformando ideias de produto em apps prontos para o mercado.'
      ),
      L(
        'Delivered the full product around each app: Node APIs, Firebase backends (Auth, Firestore, Cloud Messaging) and React admin panels, owning mobile, web and backend end to end.',
        'Entreguei o produto completo em volta de cada app: APIs em Node, backends Firebase (Auth, Firestore, Cloud Messaging) e painéis admin em React, cuidando de mobile, web e backend de ponta a ponta.'
      ),
      L(
        'Worked directly with founders and designers to shape scalable app structures and deliver MVPs and production releases.',
        'Trabalhei diretamente com fundadores e designers para desenhar estruturas escaláveis e entregar MVPs e versões de produção.'
      )
    ],
    tags: ['React Native', 'TypeScript', 'Expo', 'Node', 'Firebase', 'CodePush']
  }
];
