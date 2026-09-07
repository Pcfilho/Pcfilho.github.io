import { L } from '../i18n.js';

const mk = (ios, android) => {
  const a = [];
  if (ios) a.push({ label: 'App Store', url: ios });
  if (android) a.push({ label: 'Google Play', url: android });
  return a;
};

export const apps = [
  {
    key: 'collective',
    name: 'Collective Health',
    short: 'Collective',
    mono: 'C',
    icon: 'assets/collective.webp',
    domain: L('Health', 'Saúde'),
    year: '2026',
    iconBg: 'linear-gradient(135deg,#2dd4bf,#0ea5a3)',
    cs: {
      problem: L(
        'On a health-benefits app serving 500k+ members across 70+ enterprise employers, members could not reliably reach support, and the app had no automated test safety net.',
        'Em um app de benefícios de saúde que atende 500 mil+ membros em 70+ empresas, os membros não conseguiam suporte confiável e o app não tinha rede de testes automatizados.'
      ),
      build: L(
        "The team's first end-to-end test framework, from zero: Maestro with 32 flows across 11 feature areas, a Node mock server, and nightly iOS and Android CI. I led the React Native 0.83 upgrade for Fabric, TurboModules and the React Compiler, and owned chat and notifications with UJET (Google CCAI), Customer.io and Firebase.",
        'O primeiro framework de testes ponta a ponta do time, do zero: Maestro com 32 fluxos em 11 áreas, um servidor mock em Node e CI noturno no iOS e Android. Liderei o upgrade do React Native 0.83 para Fabric, TurboModules e React Compiler, e assumi chat e notificações com UJET (Google CCAI), Customer.io e Firebase.'
      ),
      impact: L(
        'The React Compiler cut benchmarked re-renders by 91% (55 to 5), warm Android CI dropped from 75 to 16 minutes, and I cleared 449 TypeScript and 149 hook violations while bringing the iOS activation path back.',
        'O React Compiler cortou os re-renders medidos em 91% (55 para 5), o CI do Android caiu de 75 para 16 minutos, e limpei 449 erros de TypeScript e 149 de hooks enquanto trazia de volta o caminho de ativação no iOS.'
      )
    },
    stores: mk('https://apps.apple.com/app/id1032100065', 'https://play.google.com/store/apps/details?id=com.collectivehealth.member')
  },
  {
    key: 'pluma',
    name: 'Pluma Finance',
    short: 'Pluma',
    mono: 'P',
    icon: 'assets/pluma.webp',
    domain: L('Fintech', 'Fintech'),
    year: '2026',
    iconBg: 'linear-gradient(135deg,#8b6cff,#5b8cff)',
    cs: {
      problem: L(
        'People manage money across several banks with no single, trustworthy view.',
        'As pessoas cuidam do dinheiro em vários bancos sem uma visão única e confiável.'
      ),
      build: L(
        'A personal-finance iOS app built from scratch to the App Store: Supabase auth (PKCE, TOTP 2FA), Open Finance with Pluggy, tRPC and TanStack Query, a native Liquid Glass UI, RevenueCat, and a full EAS Build and OTA pipeline on GitHub Actions.',
        'App de finanças pessoais feito do zero até a App Store: auth Supabase (PKCE, 2FA TOTP), Open Finance com Pluggy, tRPC e TanStack Query, UI nativa Liquid Glass, RevenueCat e pipeline completo EAS Build e OTA no GitHub Actions.'
      ),
      impact: L(
        'Live on the App Store. I built the whole app with an AI coding workflow (Claude Code).',
        'No ar na App Store. Construí o app inteiro com um fluxo de código com IA (Claude Code).'
      )
    },
    stores: mk('https://apps.apple.com/app/id6759451648', null)
  },
  {
    key: 'ploomes',
    name: 'Ploomes CRM',
    short: 'Ploomes',
    mono: 'P',
    icon: 'assets/ploomes.webp',
    domain: L('CRM · Sales', 'CRM · Vendas'),
    year: '2023',
    iconBg: 'linear-gradient(135deg,#4f8cff,#2563eb)',
    cs: {
      problem: L(
        'At the largest CRM company in Latin America, with 3,000+ business clients, sales reps in the field lost data and trust in low-connectivity areas.',
        'Na maior empresa de CRM da América Latina, com 3.000+ clientes, vendedores em campo perdiam dados e confiança em áreas de baixa conectividade.'
      ),
      build: L(
        'An offline architecture with RealmDB and OData, an offline-cached universal search, a Jest and Maestro test pipeline, and Bitrise and CodePush CI/CD.',
        'Arquitetura offline com RealmDB e OData, busca universal com cache offline, pipeline de testes Jest e Maestro, e CI/CD Bitrise e CodePush.'
      ),
      impact: L(
        '90% fewer support tickets, 40% fewer regressions and 70% faster deploys for more than 5,000 daily users.',
        '90% menos tickets, 40% menos regressões e deploys 70% mais rápidos para mais de 5.000 usuários diários.'
      )
    },
    stores: mk('https://apps.apple.com/app/id1405137541', 'https://play.google.com/store/apps/details?id=com.ploomes.mobileapp')
  },
  {
    key: 'agrolite',
    name: 'Agrolite Gestor',
    short: 'Agrolite',
    mono: 'A',
    icon: 'assets/agrolite.webp',
    domain: L('Agritech · IoT', 'Agritech · IoT'),
    year: '2021',
    iconBg: 'linear-gradient(135deg,#5bd07a,#27a34a)',
    cs: {
      problem: L(
        'Farms run offline and depend on proprietary hardware.',
        'Fazendas operam offline e dependem de hardware proprietário.'
      ),
      build: L(
        'An offline-first architecture, custom Bluetooth and WebSocket native modules, and a redesigned dashboard with charts, goals and camera grids.',
        'Arquitetura offline-first, módulos nativos de Bluetooth e WebSocket sob medida, e dashboard redesenhado com gráficos, metas e grid de câmeras.'
      ),
      impact: L(
        '22% more app usage and reliable real-time control of farm hardware.',
        '22% mais uso e controle confiável em tempo real do hardware agrícola.'
      )
    },
    stores: mk('https://apps.apple.com/app/id1607414504', 'https://play.google.com/store/apps/details?id=com.agrolitemanager')
  }
];
