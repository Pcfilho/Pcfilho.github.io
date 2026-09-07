import { L } from '../i18n.js';

export const products = [
  {
    key: 'daily',
    name: 'Daily Logs',
    icon: 'assets/daily.webp',
    line: L(
      'Offline workout tracker. Free, no ads, Live Activities and widgets in Swift.',
      'Treinos offline. Grátis, sem anúncios, Live Activities e widgets em Swift.'
    ),
    status: L('LIVE · App Store + Web', 'NO AR · App Store + Web'),
    stack: 'Expo · SQLite · Drizzle · Swift',
    url: 'https://apps.apple.com/us/app/daily-logs-offline-workouts/id6757203084'
  },
  {
    key: 'nino',
    name: 'Nino',
    icon: 'assets/nino.webp',
    line: L(
      'Digital pet companion: AI cartoon of your pet, vaccine wallet, and an AI vet.',
      'Companheiro digital do pet: cartoon por IA, carteira de vacinas e um veterinário IA.'
    ),
    status: L('BUILDING · 600+ PRs merged', 'EM CONSTRUÇÃO · 600+ PRs integrados'),
    stack: 'Expo · NestJS · Postgres · Turborepo',
    url: 'https://github.com/Pcfilho'
  }
];

export const manifesto = L(
  "I also build my own. Not for the side income: to feel the whole cycle. Backend, store review, analytics, support tickets at 11pm. It makes me a better engineer on someone else's product.",
  'Também construo os meus. Não pela renda extra: pra sentir o ciclo inteiro. Backend, review da loja, analytics, ticket de suporte às 23h. Isso me faz um engenheiro melhor no produto dos outros.'
);
