/**
 * Games page data + rendering.
 * GAMES is the source of truth, keyed by ID (== image filename, no extension).
 */

export const GAMES = {
  sven_coop:      { name: 'Sven Coop',           url: 'https://store.steampowered.com/app/225840/Sven_Coop/',                     image: 'sven_coop.png',    players: 'inf' },
  muck:           { name: 'Muck',                url: 'https://store.steampowered.com/app/1625450/Muck/',                        image: 'muck.png',        players: 8 },
  repo:           { name: 'R.E.P.O.',            url: 'https://store.steampowered.com/app/3241660/REPO/',                        image: 'repo.jpg',        players: 6 },
  lethal_company: { name: 'Lethal Company',      url: 'https://store.steampowered.com/app/1966720/Lethal_Company/',              image: 'lethal_company.png', players: 4 },
  unrailed:       { name: 'Unrailed',            url: 'https://store.steampowered.com/app/1016920/Unrailed/',                    image: 'unrailed.png',    players: 4 },
  helldivers:     { name: 'Helldivers 2',        url: 'https://store.steampowered.com/app/553850/HELLDIVERS_2/',                 image: 'helldivers.jpg',  players: 4 },

  factorio_vs:    { name: 'Factorio (verses)',   url: 'https://store.steampowered.com/app/427520/Factorio/',                     image: 'factorio_vs.png', players: 'inf' },
  sc2:            { name: 'StarCraft II',        url: 'https://starcraft2.blizzard.com/en-us/',                                  image: 'sc2.png',         players: 12 },
  unrailed2:      { name: 'Unrailed 2',          url: 'https://store.steampowered.com/app/2211170/Unrailed_2_Back_on_Track/',    image: 'unrailed2.jpg',   players: 8 },
  l4d2:           { name: 'Left 4 Dead 2',       url: 'https://store.steampowered.com/app/550/Left_4_Dead_2/',                   image: 'l4d2.png',        players: 8 },

  crab_game:      { name: 'Crab Game',           url: 'https://store.steampowered.com/app/1782210/Crab_Game/',                   image: 'crab_game.png',   players: 'inf' },
  hldm:           { name: 'Half-Life Deathmatch',url: 'https://store.steampowered.com/app/360/HalfLife_Deathmatch_Source/',      image: 'hldm.png',        players: 'inf' },
  hldm2:          { name: 'HL2 Deathmatch',      url: 'https://store.steampowered.com/app/320/HalfLife_2_Deathmatch/',           image: 'hldm2.png',       players: 'inf' },
  duck_game:      { name: 'Duck Game',           url: 'https://store.steampowered.com/app/312530/Duck_Game/',                    image: 'duck_game.png',   players: 8 },

  deadlock:       { name: 'Deadlock',            url: 'https://store.steampowered.com/app/1422450/Deadlock/',                    image: 'deadlock.png' },
  dota2:          { name: 'Dota Allstars',       url: 'https://store.steampowered.com/app/570/Dota_2/',                          image: 'dota2.png' },
  zomboid:        { name: 'Project Zomboid',     url: 'https://store.steampowered.com/app/108600/Project_Zomboid/',             image: 'zomboid.png' },
  factorio:       { name: 'Factorio (freeplay)', url: 'https://store.steampowered.com/app/427520/Factorio/',                    image: 'factorio.png' },
  mc:             { name: 'Minecraft',           url: 'https://www.minecraft.net/',                                              image: 'mc.png' },

  sims:           { name: 'The Sims',            url: 'https://www.ea.com/games/the-sims',                                       image: 'sims.png', players: '1 player' },
};

// Heading order + which games fall under each. `sep` draws a divider above the section.
const SECTIONS = [
  { title: 'Co-op',                icon: 'la-users',      color: 'text-accent-green', ids: ['sven_coop', 'muck', 'repo', 'lethal_company', 'unrailed', 'helldivers'] },
  { title: 'Team Versus',          icon: 'la-flag',       color: 'text-accent-blue',  ids: ['factorio_vs', 'sc2', 'unrailed2', 'l4d2'] },
  { title: 'Versus',                icon: 'la-crosshairs', color: 'text-accent-blue',  ids: ['crab_game', 'hldm', 'hldm2', 'duck_game'] },
  { title: 'Out of the Question',  icon: 'la-ban',        color: 'text-accent-orange', ids: ['deadlock', 'dota2', 'zomboid', 'factorio', 'mc'], sep: true },
  { title: 'Anti-Social',          icon: 'la-user',       color: 'text-text-muted',   ids: ['sims'], sep: true },
];

function badgeHtml(players) {
  if (players === undefined) return '';
  if (players === 'inf') return '<span class="badge badge-green"><i class="las la-users"></i> <i class="las la-infinity"></i></span>';
  if (typeof players === 'number') return `<span class="badge badge-green"><i class="las la-users"></i> ${players}</span>`;
  return `<span class="badge badge-green">${players}</span>`;
}

function cardHtml(id) {
  const g = GAMES[id];
  return `
    <a href="${g.url}" target="_blank" class="game-card">
      <div class="flex items-center justify-center"><img src="/static/img/games/${g.image}" alt="${g.name}" class="h-full w-full object-cover"></div>
      <div class="p-3">
        <div class="font-bold">${g.name}</div>
        ${badgeHtml(g.players)}
      </div>
    </a>
  `;
}

function sectionHtml(section) {
  const sep = section.sep ? '<div class="border-t border-border-c mb-10"></div>' : '';
  return `
    ${sep}
    <section class="mb-10">
      <h1 class="font-ubuntu text-2xl font-bold mb-4 ${section.color}"><i class="las ${section.icon}"></i> ${section.title}</h1>
      <div class="pl-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        ${section.ids.map(cardHtml).join('')}
      </div>
    </section>
  `;
}

export function initGamesPage() {
  const el = document.getElementById('games-content');
  if (!el) return;
  el.innerHTML = SECTIONS.map(sectionHtml).join('');
}
