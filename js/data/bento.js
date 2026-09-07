import { L } from '../i18n.js';

export const bento = {
  terminal: {
    cmd: 'npx paulo@stack init',
    intro: [
      L('Loaded 6 years of React Native.', 'Carregados 6 anos de React Native.'),
      L('Shipped 5 apps to the stores.', 'Publicados 5 apps nas lojas.')
    ],
    numberKeys: [0, 3, 2, 4], // indexes into numbers: tickets, CI, re-renders, members
    productLines: [
      L('Built Daily Logs solo, end to end.', 'Construí o Daily Logs sozinho, de ponta a ponta.'),
      L('Building Nino: Expo + NestJS + Postgres.', 'Construindo o Nino: Expo + NestJS + Postgres.')
    ],
    outro: [
      L('Removing imposter module.', 'Removendo módulo impostor.')
    ],
    done: L('Success! Engineer deployed.', 'Sucesso! Engenheiro publicado.')
  },
  numbers: [
    { v: '90%', l: L('fewer support tickets', 'menos tickets de suporte'), org: 'Ploomes', line: L('Cut support tickets by 90% (Ploomes).', 'Cortei os tickets de suporte em 90% (Ploomes).') },
    { v: '70%', l: L('faster deploys', 'deploys mais rápidos'), org: 'Ploomes', line: L('Made deploys 70% faster (Ploomes).', 'Deploys 70% mais rápidos (Ploomes).') },
    { v: '91%', l: L('fewer re-renders', 'menos re-renders'), org: 'Collective Health', line: L('Removed 91% of re-renders with React Compiler.', 'Removi 91% dos re-renders com React Compiler.') },
    { v: '75 to 16 min', l: L('Android CI', 'CI do Android'), org: 'Collective Health', line: L('Cut Android CI from 75 to 16 min (Collective Health).', 'CI do Android de 75 para 16 min (Collective Health).') },
    { v: '500k+', l: L('members served', 'membros atendidos'), org: 'Collective Health', line: L('Reached 500k+ members.', 'Alcancei 500 mil+ membros.') },
    { v: '22%', l: L('more app usage', 'mais uso do app'), org: 'Agrolite', line: L('Raised app usage 22% (Agrolite).', 'Aumentei o uso do app em 22% (Agrolite).') }
  ],
  world: {
    h: L('Apps in production on three continents', 'Apps em produção em três continentes'),
    c: L('Brazil, Latin America, the US and Portugal. 500k+ people reached, 5 apps in the stores.', 'Brasil, América Latina, EUA e Portugal. 500 mil+ pessoas alcançadas, 5 apps nas lojas.'),
    cities: [
      { name: 'Fortaleza', lon: -38.5, lat: -3.7, home: true },
      { name: 'São Paulo', lon: -46.6, lat: -23.5 },
      { name: 'Mexico City', lon: -99.1, lat: 19.4 },
      { name: 'Bogotá', lon: -74.1, lat: 4.7 },
      { name: 'Buenos Aires', lon: -58.4, lat: -34.6 },
      { name: 'Lisbon', lon: -9.1, lat: 38.7 },
      { name: 'San Francisco', lon: -122.4, lat: 37.8 },
      { name: 'New York', lon: -74.0, lat: 40.7 }
    ]
  },
  brazil: { h: L('Remote from the coast', 'Remoto, do litoral'), label: 'Fortaleza · 3.7°S 38.5°W · GMT-3', lon: -38.5, lat: -3.7 },
  pets: {
    h: L('My supervisors', 'Meus supervisores'),
    c: L('Bull, French Bulldog. TimTim, rescued street cat.', 'Bull, bulldog francês. TimTim, gato de rua resgatado.'),
    list: [{ key: 'bull', name: 'Bull' }, { key: 'timtim', name: 'TimTim' }]
  },
  stack: [
    'React Native', 'TypeScript', 'Expo', 'EAS', 'Swift', 'Kotlin', 'Fabric', 'TurboModules',
    'React Compiler', 'Reanimated', 'Zustand', 'TanStack Query', 'RealmDB', 'SQLite', 'Drizzle',
    'Jest', 'Maestro', 'GitHub Actions', 'Bitrise', 'Firebase', 'Supabase', 'Sentry', 'RevenueCat',
    'NestJS', 'Postgres'
  ]
};
