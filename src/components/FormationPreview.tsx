
type FormationPreviewProps = {
  code: string;
  positions: string[];
  selected?: boolean;
  onClick?: () => void;
};

type Point = {
  x: number;
  y: number;
};

const layouts: Record<string, Point[]> = {
  '4-3-3': [
    { x: 50, y: 88 },
    { x: 15, y: 70 }, { x: 38, y: 70 },
    { x: 62, y: 70 }, { x: 85, y: 70 },
    { x: 30, y: 49 }, { x: 50, y: 55 },
    { x: 70, y: 49 },
    { x: 15, y: 23 }, { x: 50, y: 19 },
    { x: 85, y: 23 },
  ],
  '4-2-3-1': [
    { x: 50, y: 88 },
    { x: 15, y: 70 }, { x: 38, y: 70 },
    { x: 62, y: 70 }, { x: 85, y: 70 },
    { x: 38, y: 55 }, { x: 62, y: 55 },
    { x: 50, y: 39 },
    { x: 15, y: 25 }, { x: 50, y: 17 },
    { x: 85, y: 25 },
  ],
  '4-4-2': [
    { x: 50, y: 88 },
    { x: 15, y: 70 }, { x: 38, y: 70 },
    { x: 62, y: 70 }, { x: 85, y: 70 },
    { x: 15, y: 48 }, { x: 38, y: 48 },
    { x: 62, y: 48 }, { x: 85, y: 48 },
    { x: 38, y: 20 }, { x: 62, y: 20 },
  ],
  '4-3-1-2': [
    { x: 50, y: 88 },
    { x: 15, y: 70 }, { x: 38, y: 70 },
    { x: 62, y: 70 }, { x: 85, y: 70 },
    { x: 30, y: 53 }, { x: 50, y: 55 },
    { x: 70, y: 53 },
    { x: 50, y: 36 },
    { x: 38, y: 19 }, { x: 62, y: 19 },
  ],
  '3-5-2': [
    { x: 50, y: 88 },
    { x: 25, y: 70 }, { x: 50, y: 70 },
    { x: 75, y: 70 },
    { x: 12, y: 49 }, { x: 38, y: 53 },
    { x: 62, y: 53 }, { x: 50, y: 37 },
    { x: 88, y: 49 },
    { x: 38, y: 19 }, { x: 62, y: 19 },
  ],
  '4-2-2-2': [
    { x: 50, y: 88 },
    { x: 15, y: 70 }, { x: 38, y: 70 },
    { x: 62, y: 70 }, { x: 85, y: 70 },
    { x: 38, y: 55 }, { x: 62, y: 55 },
    { x: 20, y: 37 }, { x: 80, y: 37 },
    { x: 35, y: 19 }, { x: 65, y: 19 },
  ],
  '4-2-1-3': [
    { x: 50, y: 88 },
    { x: 15, y: 70 }, { x: 38, y: 70 },
    { x: 62, y: 70 }, { x: 85, y: 70 },
    { x: 38, y: 55 }, { x: 62, y: 55 },
    { x: 50, y: 39 },
    { x: 15, y: 22 }, { x: 50, y: 17 },
    { x: 85, y: 22 },
  ],
};

export default function FormationPreview({
  code,
  positions,
  selected = false,
  onClick,
}: FormationPreviewProps) {
  const points = layouts[code] ?? layouts['4-3-3'];

  return (
    <button
      type="button"
      className={`formation-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="formation-card-title">
        <strong>{code}</strong>
        <span>{positions.length} игроков</span>
      </div>

      <div className="formation-pitch">
        <div className="pitch-halfway" />
        <div className="pitch-center-circle" />
        <div className="pitch-box pitch-box-top" />
        <div className="pitch-box pitch-box-bottom" />

        {positions.map((position, index) => {
          const point = points[index];

          return (
            <span
              key={`${position}-${index}`}
              className="formation-player"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            >
              {position}
            </span>
          );
        })}
      </div>

      <div className="formation-card-footer">
        {selected ? '✓ Выбрана' : 'Выбрать схему'}
      </div>
    </button>
  );
}
