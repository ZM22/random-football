
'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FootballPitch from '@/components/FootballPitch';
import { toPng } from 'html-to-image';
import { calculateFormationChemistry } from '@/lib/chemistry';

type Player = {
  id: string;
  full_name: string;
  known_as: string | null;
  photo_url: string | null;
  card_type: 'gold' | 'icon' | 'special';
  position: string;
  overall: number | null;
  pace: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defending: number | null;
  physical: number | null;
  gk_diving: number | null;
  gk_handling: number | null;
  gk_kicking: number | null;
  gk_reflexes: number | null;
  gk_speed: number | null;
  gk_positioning: number | null;
  teamName: string;
  teamId: string;
  teamKind: string;
  teamCountryCode: string | null;
  teamLogoUrl: string | null;
  nationality: string | null;
  teams: {
    teamId: string;
    teamKind: string;
    relationship: string;
    leagueId: string | null;
  }[];
};

function DraftContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const nationalId = searchParams.get('national');
  const favoriteId = searchParams.get('favorite');
  const rivalId = searchParams.get('rival');
  const formationCode = searchParams.get('formation') || '4-3-3';

  const teamIds = [nationalId, favoriteId, rivalId].filter(
    (id): id is string => Boolean(id)
  );
  const storageKey = `random-football-draft:${nationalId}:${favoriteId}:${rivalId}:${formationCode}`;
  const [positions, setPositions] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<number, Player>>({});
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<(Player | null)[]>([]);
  const [replacementAvailable, setReplacementAvailable] = useState(true);
  const [replacementMode, setReplacementMode] = useState(false);
  const [replacementInfoOpen, setReplacementInfoOpen] = useState(false);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullSquad, setShowFullSquad] = useState(
  searchParams.get('complete') === '1'
);

  const squadImageRef = useRef<HTMLDivElement | null>(null);
  const [squadName, setSquadName] = useState('');
  const [viewedPlayerIndex, setViewedPlayerIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadDraftData() {
      const supabase = createClient();

      const { data: formation, error: formationError } = await supabase
        .from('formations')
        .select('positions')
        .eq('code', formationCode)
        .eq('is_active', true)
        .single();

      if (formationError) {
        setError(formationError.message);
        setLoading(false);
        return;
      }

      setPositions(formation.positions);

      if (teamIds.length !== 3) {
        setError('Не найдены выбранные команды. Вернись на первый экран.');
        setLoading(false);
        return;
      }

      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, kind, country_code, logo_url')
        .in('id', teamIds);

      if (teamsError) {
        setError(teamsError.message);
        setLoading(false);
        return;
      }

      const { data: links, error: linksError } = await supabase
        .from('player_teams')
        .select('player_id, team_id')
        .in('team_id', teamIds);

      if (linksError) {
        setError(linksError.message);
        setLoading(false);
        return;
      }

      const playerIds = [...new Set((links ?? []).map((item) => item.player_id))];

      if (playerIds.length === 0) {
        setTeamNames(teams?.map((team) => team.name) ?? []);
        setLoading(false);
        return;
      }

      const [
        { data: playerData, error: playerError },
        { data: positionData, error: positionError },
        { data: ratingData, error: ratingError },
      ] = await Promise.all([
        supabase
          .from('players')
	  .select('id, full_name, known_as, photo_url, card_type, nationality')
          .in('id', playerIds),
        supabase
          .from('player_positions')
          .select('player_id, position')
          .in('player_id', playerIds),
        supabase
          .from('player_ratings')
.select(`
  player_id,
  overall,
  pace,
  shooting,
  passing,
  dribbling,
  defending,
  physical,
  gk_diving,
  gk_handling,
  gk_kicking,
  gk_reflexes,
  gk_speed,
  gk_positioning,
  is_peak
`)
.in('player_id', playerIds),
      ]);

      if (playerError || positionError || ratingError) {
        setError(
          playerError?.message ||
          positionError?.message ||
          ratingError?.message ||
          'Не удалось загрузить игроков'
        );
        setLoading(false);
        return;
      }
      
// Загружаем всю историю команд игроков
const { data: historyLinks, error: historyLinksError } = await supabase
  .from('player_teams')
  .select('player_id, team_id, relationship')
  .in('player_id', playerIds);

if (historyLinksError) {
  setError(historyLinksError.message);
  setLoading(false);
  return;
}

const historyTeamIds = [
  ...new Set((historyLinks ?? []).map((item) => item.team_id)),
];

const { data: historyTeams, error: historyTeamsError } =
  historyTeamIds.length > 0
    ? await supabase
        .from('teams')
        .select('id, kind, league_id')
        .in('id', historyTeamIds)
    : { data: [], error: null };

if (historyTeamsError) {
  setError(historyTeamsError.message);
  setLoading(false);
  return;
}

const historyTeamMap = new Map(
  (historyTeams ?? []).map((team) => [team.id, team])
);

const chemistryTeamsMap = new Map<
  string,
  {
    teamId: string;
    teamKind: string;
    relationship: string;
    leagueId: string | null;
  }[]
>();

(historyLinks ?? []).forEach((link) => {
  const team = historyTeamMap.get(link.team_id);

  if (!team) return;

  const current = chemistryTeamsMap.get(link.player_id) ?? [];

  current.push({
    teamId: link.team_id,
    teamKind: team.kind,
    relationship: link.relationship,
    leagueId: team.league_id,
  });

  chemistryTeamsMap.set(link.player_id, current);
});

      const positionMap = new Map<string, string[]>();
      positionData?.forEach((item) => {
        const current = positionMap.get(item.player_id) ?? [];
        current.push(item.position);
        positionMap.set(item.player_id, current);
      });

     const ratingMap = new Map<string, number>();
const statsMap = new Map<
  string,
  {
    pace: number | null;
    shooting: number | null;
    passing: number | null;
    dribbling: number | null;
    defending: number | null;
    physical: number | null;
    gk_diving: number | null;
    gk_handling: number | null;
    gk_kicking: number | null;
    gk_reflexes: number | null;
    gk_speed: number | null;
    gk_positioning: number | null;
  }
>();

ratingData?.forEach((item) => {
  if (item.overall !== null) {
    const current = ratingMap.get(item.player_id);

    if (current === undefined || item.overall > current) {
      ratingMap.set(item.player_id, item.overall);
    }
  }

  statsMap.set(item.player_id, {
    pace: item.pace,
    shooting: item.shooting,
    passing: item.passing,
    dribbling: item.dribbling,
    defending: item.defending,
    physical: item.physical,
    gk_diving: item.gk_diving,
    gk_handling: item.gk_handling,
    gk_kicking: item.gk_kicking,
    gk_reflexes: item.gk_reflexes,
    gk_speed: item.gk_speed,
    gk_positioning: item.gk_positioning,
  });
});

     const teamMap = new Map(
  teams?.map((team) => [team.id, team]) ?? []
);

      const loadedPlayers: Player[] = [];

      (links ?? []).forEach((link) => {
        const player = playerData?.find(
          (item) => item.id === link.player_id
        );

        if (!player) return;

        const playerPositions = positionMap.get(player.id) ?? [];

        playerPositions.forEach((position) => {
          loadedPlayers.push({
  ...player,
  nationality: player.nationality,
  teams: chemistryTeamsMap.get(player.id) ?? [],
  position,
overall: ratingMap.get(player.id) ?? null,
pace: statsMap.get(player.id)?.pace ?? null,
shooting: statsMap.get(player.id)?.shooting ?? null,
passing: statsMap.get(player.id)?.passing ?? null,
dribbling: statsMap.get(player.id)?.dribbling ?? null,
defending: statsMap.get(player.id)?.defending ?? null,
physical: statsMap.get(player.id)?.physical ?? null,
gk_diving: statsMap.get(player.id)?.gk_diving ?? null,
gk_handling: statsMap.get(player.id)?.gk_handling ?? null,
gk_kicking: statsMap.get(player.id)?.gk_kicking ?? null,
gk_reflexes: statsMap.get(player.id)?.gk_reflexes ?? null,
gk_speed: statsMap.get(player.id)?.gk_speed ?? null,
gk_positioning: statsMap.get(player.id)?.gk_positioning ?? null,
teamName: teamMap.get(link.team_id)?.name ?? 'Команда',
teamId: link.team_id,
teamKind: teamMap.get(link.team_id)?.kind ?? '',
teamCountryCode: teamMap.get(link.team_id)?.country_code ?? null,
teamLogoUrl: teamMap.get(link.team_id)?.logo_url ?? null,
          });
        });
      });

      setPlayers(loadedPlayers);
      setTeamNames(teams?.map((team) => team.name) ?? []);
      setLoading(false);
    }

    loadDraftData();
  }, [formationCode, nationalId, favoriteId, rivalId]);

  function openSlot(index: number) {
    if (activeSlot !== null) return;

if (replacementMode) {
  if (!selected[index]) return;
} else {
  if (selected[index]) return;
}

    const position = positions[index];
    const usedIds = new Set(
  Object.entries(selected)
    .filter(([slot]) => !replacementMode || Number(slot) !== index)
    .map(([, player]) => player.id)
);

    const available: (Player | null)[] = [];
    const addedIds = new Set<string>();

    teamIds.forEach((teamId) => {
      const teamPlayer = players.filter(
        (player) =>
          player.teamId === teamId &&
player.position === position &&
!usedIds.has(player.id) &&
!seenIds.has(player.id) &&
!addedIds.has(player.id)
      );

      const randomPlayer = (() => {
  if (teamPlayer.length === 0) return null;

  const weights = replacementMode
  ? {
      gold: (90 / 98) * 90,
      special: (8 / 98) * 90,
      icon: 10,
    }
  : {
      gold: 90,
      special: 8,
      icon: 2,
    };

  const availableTypes = [
    ...new Set(teamPlayer.map((player) => player.card_type)),
  ];

  const totalWeight = availableTypes.reduce(
    (sum, type) => sum + weights[type],
    0
  );

  let roll = Math.random() * totalWeight;

  const selectedType =
    availableTypes.find((type) => {
      roll -= weights[type];
      return roll < 0;
    }) ?? availableTypes[0];

  const playersOfType = teamPlayer.filter(
    (player) => player.card_type === selectedType
  );

  return playersOfType[
    Math.floor(Math.random() * playersOfType.length)
  ] ?? null;
})();

      if (randomPlayer) {
        addedIds.add(randomPlayer.id);
      }

      available.push(randomPlayer);
    });

    setCandidates(available);
    setRevealedCards([]);
   
setSeenIds((previous) => {
  const next = new Set(previous);

  available.forEach((player) => {
    if (player) next.add(player.id);
  });

  return next;
});

setActiveSlot(index);
  }

    function revealCard(index: number) {
  setRevealedCards((previous) =>
    previous.includes(index) ? previous : [...previous, index]
  );
}  

    function choosePlayer(player: Player) {
  if (activeSlot === null) return;

  setSelected((previous) => ({
    ...previous,
    [activeSlot]: player,
  }));

  if (replacementMode) {
    setReplacementAvailable(false);
    setReplacementMode(false);
  }

  setActiveSlot(null);
}

function createNewDraft() {
  localStorage.removeItem(storageKey);
  setSquadName('');
  window.location.href = '/';
}

async function saveDraft() {
  if (!squadImageRef.current) return;

  try {
    const dataUrl = await toPng(squadImageRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'random-football-draft.png';
    link.click();
  } catch (error) {
    console.error('Ошибка сохранения команды:', error);
    alert('Не удалось сохранить изображение команды.');
  }
}

  const selectedCount = Object.keys(selected).length;
  const fullSquadPlayers = Object.fromEntries(
  Object.entries(selected).map(([index, player]) => [
    index,
    {
      id: player.id,
      name: player.known_as || player.full_name,
      overall: player.overall,
      photo_url: player.photo_url,
      card_type: player.card_type,
      position: player.position,
      pace: player.pace,
      shooting: player.shooting,
      passing: player.passing,
      dribbling: player.dribbling,
      defending: player.defending,
      physical: player.physical,
      gk_diving: player.gk_diving,
      gk_handling: player.gk_handling,
      gk_kicking: player.gk_kicking,
      gk_reflexes: player.gk_reflexes,
      gk_speed: player.gk_speed,
      gk_positioning: player.gk_positioning,
    },
  ])
);
  const viewedPlayer =
  viewedPlayerIndex !== null
    ? selected[viewedPlayerIndex]
    : null;


const [isDraftComplete, setIsDraftComplete] = useState(false);

  const averageRating =
  selectedCount === 11
    ? Math.round(
        Object.values(selected).reduce(
          (sum, player) => sum + (player.overall ?? 0),
          0
        ) / 11
      )
    : 0;

const {
  score: chemistryScore,
  maxScore: chemistryMaxScore,
  pairs: chemistryPairs,
} = calculateFormationChemistry(formationCode, selected);

  return (
    <main className="shell">
    {showFullSquad ? (
  <section className="full-squad-screen">

  {/* Здесь весь существующий состав */}

  <div className="squad-image-content">

  <div className="replacement-panel">
  <button
    type="button"
    className={`replacement-button ${replacementAvailable ? '' : 'used'}`}
    disabled={!replacementAvailable || replacementMode || activeSlot !== null}
    onClick={() => setReplacementInfoOpen(true)}
  >
    ДОСТУПНА ОДНА ЗАМЕНА КАРТОЧКИ
  </button>
</div>

<div className="full-squad-layout">
  <div ref={squadImageRef} className="squad-export">
    <p className="eyebrow">RANDOM FOOTBALL</p>
    <h1>{squadName.trim() || 'ТВОЯ КОМАНДА'}</h1>
    <div className="squad-export-rating">
  РЕЙТИНГ КОМАНДЫ: {averageRating}
</div>

<div className="squad-export-rating">
  ХИМИЯ КОМАНДЫ: {chemistryScore} / {chemistryMaxScore}
</div>

  <div className="full-squad-pitch">
    <FootballPitch
      chemistryPairs={chemistryPairs}
      formation={formationCode}
      positions={positions}
      selected={fullSquadPlayers}
      onSelect={(index) => {
  if (replacementMode) {
    openSlot(index);
  } else {
    setViewedPlayerIndex(index);
  }
}}
      viewMode={true}
    />
    </div>
  </div>
  <div className="full-squad-sidebar">
  <aside className={`player-details ${viewedPlayer ? 'active' : ''}`}>
    {viewedPlayer ? (
      <>
        <div className="player-details-photo">
          {viewedPlayer.photo_url && (
            <img
              src={viewedPlayer.photo_url}
              alt={viewedPlayer.full_name}
            />
          )}
        </div>

        <div className="player-details-info">
          <span className="player-details-position">
            {viewedPlayer.position}
          </span>

          <h2>
            {viewedPlayer.known_as || viewedPlayer.full_name}
          </h2>

          <div className="player-details-rating">
            {viewedPlayer.overall ?? '—'}
          </div>

          {(
            viewedPlayer.position === 'GK'
              ? [
                  ['Нырок', viewedPlayer.gk_diving],
                  ['Игра руками', viewedPlayer.gk_handling],
                  ['Удар', viewedPlayer.gk_kicking],
                  ['Реакция', viewedPlayer.gk_reflexes],
                  ['Скорость', viewedPlayer.gk_speed],
                  ['Позиция', viewedPlayer.gk_positioning],
                ]
              : [
                  ['Скорость', viewedPlayer.pace],
                  ['Удар', viewedPlayer.shooting],
                  ['Пас', viewedPlayer.passing],
                  ['Дриблинг', viewedPlayer.dribbling],
                  ['Защита', viewedPlayer.defending],
                  ['Физика', viewedPlayer.physical],
                ]
          ).map(([label, value]) => (
            <div className="player-stat-row" key={label}>
              <span>{label}</span>
              <strong>{value ?? '—'}</strong>
            </div>
          ))}
        </div>
      </>
    ) : (
      <div className="player-details-empty">
        <span>Выбери футболиста</span>
        <p>Нажми на карточку игрока на поле, чтобы посмотреть его характеристики</p>
      </div>
    )}
    </aside>

  <div className="finish-actions">
    <button
      className="finish-button"
      disabled={replacementMode || activeSlot !== null}
      onClick={saveDraft}
    >
      СОХРАНИТЬ ДРАФТ
    </button>

    <button
      className="finish-button"
      disabled={replacementMode || activeSlot !== null}
      onClick={createNewDraft}
    >
      СОЗДАТЬ НОВЫЙ ДРАФТ
    </button>
  </div>
</div>
</div>
   </div>           
  </section>
) : (
  <>
      <header className="top">
        <div className="brand">
          <span className="ball">⚽</span>
          <span>RANDOM <b>FOOTBALL</b></span>
        </div>
        <span className="tag">ДРАФТ · {formationCode}</span>
      </header>

      <section className="hero">
        <p className="eyebrow">ТВОЯ КОМАНДА</p>
        <h1>
          Собери свою
          <br />
          <em>футбольную легенду.</em>
        </h1>
        <p className="sub">
          Выбирай игроков и создавай состав мечты.
        </p>
      </section>

      <section className="draft">
        {loading && <p>Загружаем игроков...</p>}
        {error && <p>Ошибка: {error}</p>}

        {!loading && !error && (
          <>
            <div className="draftHead">
              <div>
                <p className="eyebrow">ТАКТИЧЕСКАЯ СХЕМА</p>
                <h2>{formationCode}</h2>
              </div>
              <div className="counter">
                {selectedCount}
                <span> / 11</span>
              </div>
            </div>

       <FootballPitch
  chemistryPairs={chemistryPairs}
  formation={formationCode}
  positions={positions}
  selected={Object.fromEntries(
  Object.entries(selected).map(([index, player]) => [
    index,
   {
  id: player.id,
  name: player.known_as || player.full_name,
  overall: player.overall,
  photo_url: player.photo_url,
  card_type: player.card_type,
  position: player.position,

  pace: player.pace,
  shooting: player.shooting,
  passing: player.passing,
  dribbling: player.dribbling,
  defending: player.defending,
  physical: player.physical,

  gk_diving: player.gk_diving,
  gk_handling: player.gk_handling,
  gk_kicking: player.gk_kicking,
  gk_reflexes: player.gk_reflexes,
  gk_speed: player.gk_speed,
  gk_positioning: player.gk_positioning,
}
  ])
)}
  onSelect={openSlot}
/>
    <div className="finish-draft">
  <button
    type="button"
    disabled={selectedCount !== 11}
    onClick={() => setIsDraftComplete(true)}
  >
    ЗАВЕРШИТЬ ДРАФТ
  </button>

  {selectedCount !== 11 && (
    <p>Выбери ещё {11 - selectedCount} игроков</p>
  )}
</div>
          </>
        )}
      </section>

      {isDraftComplete && (
  <div className="player-modal-backdrop">
    <div className="player-modal">
      <p className="eyebrow">ДРАФТ ЗАВЕРШЁН</p>
      <h2>Твоя команда готова!</h2>

      <div className="finish-rating">
        <span>ОБЩИЙ РЕЙТИНГ</span>
        <strong>{averageRating}</strong>
      </div>

      <div className="finish-rating">
  <span>ХИМИЯ КОМАНДЫ</span>
  <strong>{chemistryScore} / {chemistryMaxScore}</strong>
</div>

      <p>Ты собрал состав из 11 футболистов.</p>
      
<p className="squad-name-label">
  Дай название своему составу
</p>

<input
  className="squad-name-input"
  type="text"
  value={squadName}
  onChange={(event) => setSquadName(event.target.value)}
  placeholder="Например, GALACTICOS 2026"
  maxLength={32}
/>

      
<button
  className="finish-button"
  onClick={() => {
  setIsDraftComplete(false);
  setShowFullSquad(true);

  const params = new URLSearchParams(searchParams.toString());
  params.set('complete', '1');

  router.replace(`/draft?${params.toString()}`);
}}
>
  ПОСМОТРЕТЬ СОСТАВ
</button>

    </div>
  </div>
)}
      <footer>
        <span>RANDOM FOOTBALL © 2026</span>
        <span>Исторические футбольные легенды</span>
      </footer>
      </>
)}

{activeSlot !== null && (
        <div className="player-modal-backdrop">
          <div
            className="player-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <p className="eyebrow">ВЫБОР ФУТБОЛИСТА</p>
            <h2>Позиция {positions[activeSlot]}</h2>
            <p className="modal-subtitle">
              Выбери одного из трёх кандидатов
            </p>

            <div className="candidate-grid">
              {candidates.map((player, index) => (             
  <div
  className={`candidate-card candidate-${player?.card_type ?? 'gold'} ${
    revealedCards.includes(index) ? 'is-revealed' : ''
  }`}
  key={`${activeSlot}-${index}`}
  style={{ animationDelay: `${index * 300}ms` }}
>
                  
{player ? (
  <div className="candidate-card-inner">
    <button
      type="button"
      className="candidate-card-back"
      onClick={() => revealCard(index)}
      aria-label="Открыть карточку футболиста"
    >
      <span className="candidate-card-logo">RF</span>
      <strong>RANDOM FOOTBALL</strong>
      <span className="candidate-card-back-hint">НАЖМИ, ЧТОБЫ ОТКРЫТЬ</span>
    </button>

    <button
      type="button"
      className="candidate-button candidate-card-front"
      onClick={() => choosePlayer(player)}
    >
      <div className="candidate-photo">
        {player.photo_url ? (
          <img src={player.photo_url} alt="" />
        ) : (
          <span>
            {(player.known_as || player.full_name)
              .slice(0, 1)
              .toUpperCase()}
          </span>
        )}
        <span className="candidate-position">
          {player.position}
        </span>
      </div>

      <div className="candidate-rating">
        {player.overall ?? '—'}
      </div>

      <strong>{player.known_as || player.full_name}</strong>

      <span className="candidate-team">
  {player.teamKind === 'national' && player.teamCountryCode ? (
    <img
      src={`https://flagcdn.com/w80/${player.teamCountryCode.toLowerCase()}.png`}
      alt={player.teamName}
      className="candidate-team-logo"
    />
  ) : player.teamLogoUrl ? (
    <img
      src={player.teamLogoUrl}
      alt={player.teamName}
      className="candidate-team-logo"
    />
  ) : (
    player.teamName
  )}
</span>

      <div className="candidate-stats">
        {player.position === 'GK' ? (
          <>
            <div><b>{player.gk_diving ?? '—'}</b><span>DIV</span></div>
            <div><b>{player.gk_handling ?? '—'}</b><span>HAN</span></div>
            <div><b>{player.gk_kicking ?? '—'}</b><span>KIC</span></div>
            <div><b>{player.gk_reflexes ?? '—'}</b><span>REF</span></div>
            <div><b>{player.gk_speed ?? '—'}</b><span>SPD</span></div>
            <div><b>{player.gk_positioning ?? '—'}</b><span>POS</span></div>
          </>
        ) : (
          <>
            <div><b>{player.pace ?? '—'}</b><span>PAC</span></div>
            <div><b>{player.shooting ?? '—'}</b><span>SHO</span></div>
            <div><b>{player.passing ?? '—'}</b><span>PAS</span></div>
            <div><b>{player.dribbling ?? '—'}</b><span>DRI</span></div>
            <div><b>{player.defending ?? '—'}</b><span>DEF</span></div>
            <div><b>{player.physical ?? '—'}</b><span>PHY</span></div>
          </>
        )}
      </div>

      <span className="candidate-pick">ВЫБРАТЬ</span>
    </button>
  </div>
                  ) : (
                    <div className="candidate-empty">
                      <span>?</span>
                      <strong>Нет кандидата</strong>
                      <small>{teamNames[index] ?? 'Команда'}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {candidates.every((player) => !player) && (
              <p className="no-candidates">
                Для этой позиции пока нет доступных игроков.
                Нужно расширить базу футболистов.
              </p>
            )}
          </div>
        </div>
      )}

{replacementInfoOpen && (
    <div className="player-modal-backdrop">
      <div className="player-modal replacement-modal">
        <h2>Доступна одна замена!</h2>

        <p>
          Вы можете поменять одного игрока в составе на ваш выбор!
        </p>

        <button
          type="button"
          className="finish-button"
          onClick={() => {
            setReplacementInfoOpen(false);
            setReplacementMode(true);
          }}
        >
          ПОНЯТНО
        </button>
      </div>
    </div>
  )}
    </main>
  );
}

export default function DraftPage() {
  return (
    <Suspense fallback={<main>Загрузка драфта...</main>}>
      <DraftContent />
    </Suspense>
  );
}
