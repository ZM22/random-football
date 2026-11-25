
export type ChemistryPlayer = {
  id: string;
  nationality?: string | null;
  teams: {
    teamId: string;
    teamKind: string;
    relationship: string;
    leagueId?: string | null;
  }[];
};

export type ChemistryResult = {
  club: boolean;
  nationality: boolean;
  league: boolean;
  total: number;
};

export function calculatePairChemistry(
  playerA: ChemistryPlayer,
  playerB: ChemistryPlayer
): ChemistryResult {
  // Общий исторический клуб
  const clubsA = new Set(
    playerA.teams
      .filter(
        (team) =>
          team.teamKind === "club" &&
          team.relationship === "played_for"
      )
      .map((team) => team.teamId)
  );

  const club = playerB.teams.some(
    (team) =>
      team.teamKind === "club" &&
      team.relationship === "played_for" &&
      clubsA.has(team.teamId)
  );

  // Одинаковая национальность
  const nationality =
    Boolean(playerA.nationality?.trim()) &&
    Boolean(playerB.nationality?.trim()) &&
    playerA.nationality!.trim().toLowerCase() ===
      playerB.nationality!.trim().toLowerCase();

  // Общая лига клубов
  const leaguesA = new Set(
    playerA.teams
      .filter(
        (team) =>
          team.teamKind === "club" &&
          team.relationship === "played_for" &&
          team.leagueId
      )
      .map((team) => team.leagueId!)
  );

  const league = playerB.teams.some(
    (team) =>
      team.teamKind === "club" &&
      team.relationship === "played_for" &&
      Boolean(team.leagueId) &&
      leaguesA.has(team.leagueId!)
  );

  const total =
    Number(club) +
    Number(nationality) +
    Number(league);

  return {
    club,
    nationality,
    league,
    total,
  };
}


export function calculateSquadChemistry(
  players: ChemistryPlayer[]
): number {
  let total = 0;

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      total += calculatePairChemistry(
        players[i],
        players[j]
      ).total;
    }
  }

  return total;
}

export type ChemistryLink = [number, number];

export type FormationChemistryResult = {
  score: number;
  maxScore: number;
  pairs: {
    from: number;
    to: number;
    strength: number;
  }[];
};

// Индексы соответствуют порядку слотов в formations.positions.
const FORMATION_LINKS: Record<string, ChemistryLink[]> = {
  '4-3-3': [
    [0, 2], [0, 3],
    [1, 2], [1, 5], [1, 8],
    [2, 3], [2, 5], [2, 6],
    [3, 4], [3, 6], [3, 7],
    [4, 7], [4, 10],
    [5, 6], [5, 8], [5, 9],
    [6, 7], [6, 9],
    [7, 9], [7, 10],
    [8, 9], [9, 10],
  ],

  '4-2-3-1': [
    [0, 2], [0, 3],
    [1, 2], [1, 5], [1, 8],
    [2, 3], [2, 5],
    [3, 4], [3, 6],
    [4, 6], [4, 10],
    [5, 6], [5, 7],
    [6, 7],
    [7, 8], [7, 9], [7, 10],
    [8, 9], [9, 10],
  ],

  '4-4-2': [
    [0, 2], [0, 3],
    [1, 2], [1, 5],
    [2, 3], [2, 6],
    [3, 4], [3, 7],
    [4, 7], [4, 8],
    [5, 6],
    [6, 7], [6, 9],
    [7, 8], [7, 10],
    [8, 10],
    [9, 10],
  ],

  '4-3-1-2': [
    [0, 2], [0, 3],
    [1, 2], [1, 5],
    [2, 3], [2, 5],
    [3, 4], [3, 7],
    [4, 7],
    [5, 6], [5, 8], [5, 9],
    [6, 7], [6, 8], [6, 9], [6, 10],
    [7, 8], [7, 10],
    [8, 9], [8, 10],
    [9, 10],
  ],

  '3-5-2': [
    [0, 2],
    [1, 2], [1, 4], [1, 5],
    [2, 3], [2, 5], [2, 6],
    [3, 6], [3, 8],
    [4, 5],
    [5, 6], [5, 7],
    [6, 7], [6, 8],
    [7, 9], [7, 10],
  ],

  '4-2-2-2': [
    [0, 2], [0, 3],
    [1, 2], [1, 5], [1, 7],
    [2, 3], [2, 5],
    [3, 4], [3, 6],
    [4, 6], [4, 8],
    [5, 6], [5, 7],
    [6, 8],
    [7, 8], [7, 9],
    [8, 10],
    [9, 10],
  ],

  '4-2-1-3': [
    [0, 2], [0, 3],
    [1, 2], [1, 5], [1, 8],
    [2, 3], [2, 5],
    [3, 4], [3, 6],
    [4, 6], [4, 10],
    [5, 6], [5, 7],
    [6, 7],
    [7, 8], [7, 9], [7, 10],
    [8, 9], [9, 10],
  ],
};

export function calculateFormationChemistry(
  formationCode: string,
  selected: Record<number, ChemistryPlayer>
): FormationChemistryResult {
  const links = FORMATION_LINKS[formationCode] ?? [];

  let score = 0;
  const pairs: FormationChemistryResult['pairs'] = [];

  for (const [from, to] of links) {
    const playerA = selected[from];
    const playerB = selected[to];

    if (!playerA || !playerB) continue;

    const chemistry = calculatePairChemistry(playerA, playerB);

    score += chemistry.total;

   pairs.push({
  from,
  to,
  strength: chemistry.total,
});
  }

  return {
    score,
    maxScore: links.length * 3,
    pairs,
  };
}
