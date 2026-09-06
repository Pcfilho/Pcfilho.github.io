import { L } from '../i18n.js';

export const bento = {
  terminal: {
    cmd: 'npx paulo@stack init',
    lines: [
      L('Loaded 6 years of React Native.', 'Carregados 6 anos de React Native.'),
      L('Shipped 4 apps to the stores.', 'Publicados 4 apps nas lojas.'),
      L('Wrote the E2E suite nobody had.', 'Escrita a suíte E2E que ninguém tinha.'),
      L('Removing imposter module.', 'Removendo módulo impostor.')
    ],
    done: L('Success! Engineer deployed.', 'Sucesso! Engenheiro publicado.')
  },
  numbers: [
    { v: '90%', l: L('fewer support tickets', 'menos tickets de suporte'), org: 'Ploomes' },
    { v: '70%', l: L('faster deploys', 'deploys mais rápidos'), org: 'Ploomes' },
    { v: '91%', l: L('fewer re-renders', 'menos re-renders'), org: 'Collective Health' },
    { v: '75 to 16 min', l: L('Android CI', 'CI do Android'), org: 'Collective Health' },
    { v: '500k+', l: L('members served', 'membros atendidos'), org: 'Collective Health' },
    { v: '22%', l: L('more app usage', 'mais uso do app'), org: 'Agrolite' }
  ],
  stack: [
    'React Native', 'TypeScript', 'Expo', 'EAS', 'Swift', 'Kotlin', 'Fabric', 'TurboModules',
    'React Compiler', 'Reanimated', 'Zustand', 'TanStack Query', 'RealmDB', 'SQLite', 'Drizzle',
    'Jest', 'Maestro', 'GitHub Actions', 'Bitrise', 'Firebase', 'Supabase', 'Sentry', 'RevenueCat',
    'NestJS', 'Postgres'
  ]
};
