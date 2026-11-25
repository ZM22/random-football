
'use client';

type PlayerOnPitch = {
  id: string;
  name: string;
  overall: number | null;
  photo_url: string | null;
  card_type: 'gold' | 'icon' | 'special';
  position: string;

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
};

type FootballPitchProps = {
  formation: string;
  positions: string[];
  selected: Record<number, PlayerOnPitch>;
  onSelect: (index: number) => void;
  viewMode?: boolean;
    chemistryPairs?: {
    from: number;
    to: number;
    strength: number;
  }[];
};

type Point = {
  x: number;
  y: number;
};

const layouts: Record<string, Point[]> = {
 '4-3-3': [
  { x: 50, y: 90 }, // GK

  { x: 12, y: 68 }, // LB
  { x: 35, y: 75 }, // CB
  { x: 65, y: 75 }, // CB
  { x: 88, y: 68 }, // RB

  { x: 25, y: 47 }, // CM
  { x: 50, y: 53 }, // CM
  { x: 75, y: 47 }, // CM

  { x: 12, y: 23 }, // LW
  { x: 50, y: 18 }, // ST
  { x: 88, y: 23 }, // RW
],
  '4-2-3-1': [
  { x: 50, y: 90 }, // GK

  { x: 12, y: 68 }, // LB
  { x: 35, y: 75 }, // CB
  { x: 65, y: 75 }, // CB
  { x: 88, y: 68 }, // RB

  { x: 34, y: 48 }, // CDM
  { x: 66, y: 48 }, // CDM

  { x: 50, y: 38 }, // CAM

  { x: 12, y: 23 }, // LW
  { x: 50, y: 17 }, // ST
  { x: 88, y: 23 }, // RW
],
 '4-4-2': [
  { x: 50, y: 90 }, // GK
  { x: 12, y: 68 }, // LB
  { x: 38, y: 68 }, // CB
  { x: 62, y: 68 }, // CB
  { x: 88, y: 68 }, // RB
  { x: 12, y: 46 }, // LM
  { x: 38, y: 46 }, // CM
  { x: 62, y: 46 }, // CM
  { x: 88, y: 46 }, // RM
  { x: 36, y: 19 }, // ST
  { x: 64, y: 19 }, // ST
],
  '4-3-1-2': [
  { x: 50, y: 90 }, // GK
  { x: 10, y: 68 }, // LB
  { x: 35, y: 75 }, // CB
  { x: 65, y: 75 }, // CB
  { x: 90, y: 68 }, // RB
  { x: 25, y: 49 }, // CM
  { x: 50, y: 57 }, // CM
  { x: 75, y: 49 }, // CM
  { x: 50, y: 32 }, // CAM
  { x: 34, y: 14 }, // ST
  { x: 66, y: 14 }, // ST
],
  '3-5-2': [
  { x: 50, y: 90 }, // GK
  { x: 20, y: 68 }, // CB
  { x: 50, y: 68 }, // CB
  { x: 80, y: 68 }, // CB
  { x: 12, y: 43 }, // LWB
  { x: 34, y: 52 }, // CM
  { x: 66, y: 52 }, // CM
  { x: 50, y: 34 }, // CAM
  { x: 88, y: 43 }, // RWB
  { x: 36, y: 17 }, // ST
  { x: 64, y: 17 }, // ST
],
  '4-2-2-2': [
  { x: 50, y: 90 }, // GK
  { x: 12, y: 68 }, // LB
  { x: 35, y: 72 }, // CB
  { x: 65, y: 72 }, // CB
  { x: 88, y: 68 }, // RB
  { x: 40, y: 48 }, // CDM
  { x: 60, y: 48 }, // CDM
  { x: 20, y: 34 }, // CAM
  { x: 80, y: 34 }, // CAM
  { x: 36, y: 14 }, // ST
  { x: 64, y: 14 }, // ST
],
  '4-2-1-3': [
    { x: 50, y: 90 }, // GK
    { x: 12, y: 68 }, // LB
  { x: 35, y: 72 }, // CB
  { x: 65, y: 72 }, // CB
  { x: 88, y: 68 }, // RB
  { x: 30, y: 48 }, // CDM
  { x: 70, y: 48 }, // CDM
  { x: 50, y: 34 }, // CAM
  { x: 12, y: 19 }, // LW
  { x: 50, y: 14 }, // ST
  { x: 88, y: 19 }, // RW
],
};

export default function FootballPitch({
  formation,
  positions,
  selected,
  onSelect,
  viewMode = false,
  chemistryPairs = [],
}: FootballPitchProps) {
  const points = layouts[formation] ?? layouts['4-3-3'];

  return (
    <div className="football-pitch">
      <div className="pitch-lines">
        <div className="pitch-center-line" />
        <div className="pitch-center-circle" />
        <div className="pitch-penalty pitch-penalty-top" />
        <div className="pitch-penalty pitch-penalty-bottom" />
        <div className="pitch-goal pitch-goal-top" />
        <div className="pitch-goal pitch-goal-bottom" />
      </div>
      
         <svg
        className="chemistry-lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {chemistryPairs.map((pair) => {
          const from = points[pair.from];
          const to = points[pair.to];

          if (!from || !to) return null;

          const color =
  pair.strength === 3
    ? '#22c55e'
    : pair.strength === 2
      ? '#facc15'
      : pair.strength === 1
        ? '#ef4444'
        : '#9ca3af';

          return (
            <line
              key={`${pair.from}-${pair.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={color}
              strokeWidth={pair.strength === 3 ? 0.9 : 0.7}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}
      </svg>   

      {positions.map((position, index) => {
        const point = points[index];
        const player = selected[index];

        if (!point) return null;

        return (
          <button
            key={`${position}-${index}`}
            type="button"
            className={`pitch-marker ${player ? 'has-player' : ''}`}
            style={{
  left: `${point.x}%`,
  top: `${point.y}%`,
  zIndex: 10,
}}
            onClick={() => onSelect(index)}
            title={player?.name || `Выбрать игрока: ${position}`}
          >
           {player ? (
  <span className={`pitch-ultimate-card pitch-card-${player.card_type}`}>
    <span className="pitch-card-top">
      <span className="pitch-card-overall">
        {player.overall ?? '—'}
      </span>
      <span className="pitch-card-position">
        {player.position}
      </span>
    </span>

    <span className="pitch-card-photo">
      {player.photo_url ? (
        <img src={player.photo_url} alt={player.name} />
      ) : (
        <span>{player.name.slice(0, 1)}</span>
      )}
    </span>

    <span className="pitch-card-name" title={player.name}>
  {player.name}
</span>

    <span className="pitch-card-stats">
      {player.position === 'GK' ? (
        <>
          <span>DIV <b>{player.gk_diving ?? '—'}</b></span>
          <span>HAN <b>{player.gk_handling ?? '—'}</b></span>
          <span>KIC <b>{player.gk_kicking ?? '—'}</b></span>
          <span>REF <b>{player.gk_reflexes ?? '—'}</b></span>
          <span>SPD <b>{player.gk_speed ?? '—'}</b></span>
          <span>POS <b>{player.gk_positioning ?? '—'}</b></span>
        </>
      ) : (
        <>
          <span>PAC <b>{player.pace ?? '—'}</b></span>
          <span>SHO <b>{player.shooting ?? '—'}</b></span>
          <span>PAS <b>{player.passing ?? '—'}</b></span>
          <span>DRI <b>{player.dribbling ?? '—'}</b></span>
          <span>DEF <b>{player.defending ?? '—'}</b></span>
          <span>PHY <b>{player.physical ?? '—'}</b></span>
        </>
      )}
    </span>
  </span>
) : (
  <span className="pitch-marker-circle">
    <span className="pitch-plus">+</span>
  </span>
)}

           {!player && (
  <span className="pitch-marker-name">
    {position}
  </span>
)}
          </button>
        );
      })}
    </div>
  );
}
