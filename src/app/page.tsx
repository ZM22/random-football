
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Team = {
  id: string;
  name: string;
  kind: 'club' | 'national';
  country_code: string | null;
  logo_url: string | null;
};

type TeamFieldProps = {
  label: string;
  placeholder: string;
  teams: Team[];
  selected: Team | null;
  onSelect: (team: Team) => void;
};

function TeamIcon({ team }: { team: Team }) {
  const [imageError, setImageError] = useState(false);

  const flag = team.country_code
    ? String.fromCodePoint(
        ...team.country_code
          .toUpperCase()
          .split('')
          .map((char) => 127397 + char.charCodeAt(0))
      )
    : '⚽';

  if (team.kind === 'club' && team.logo_url && !imageError) {
    return (
      <span className="team-icon">
        <img
          src={team.logo_url}
          alt=""
          onError={() => setImageError(true)}
        />
      </span>
    );
  }

  return (
    <span className="team-icon">
      {team.kind === 'national' ? flag : team.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function TeamField({
  label,
  placeholder,
  teams,
  selected,
  onSelect,
}: TeamFieldProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return teams
      .filter((team) =>
        team.name.toLowerCase().includes(search)
      )
      .slice(0, 10);
  }, [teams, query]);

  return (
    <div className="team-field">
      <label>{label}</label>

      <div className="team-search">
        {selected && <TeamIcon team={selected} />}

        <input
          value={open ? query : selected?.name ?? query}
          placeholder={placeholder}
          onFocus={() => {
            setQuery('');
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />

        {selected && (
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setQuery('');
              onSelect(null as unknown as Team);
              setOpen(true);
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="team-results">
          {filtered.length > 0 ? (
            filtered.map((team) => (
              <button
                type="button"
                className="team-option"
                key={team.id}
                onClick={() => {
                  onSelect(team);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <TeamIcon team={team} />
                <span>{team.name}</span>
              </button>
            ))
          ) : (
            <div className="team-empty">
              Команды не найдены
            </div>
          )}

          <button
            type="button"
            className="team-option"
            onClick={() => setOpen(false)}
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [national, setNational] = useState<Team | null>(null);
  const [favoriteClub, setFavoriteClub] = useState<Team | null>(null);
  const [rivalClub, setRivalClub] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTeams() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('teams')
        .select('id, name, kind, country_code, logo_url')
        .order('name');

      if (error) {
        setError(error.message);
      } else {
        setTeams(data ?? []);
      }

      setLoading(false);
    }

    loadTeams();
  }, []);

  const clubs = teams.filter((team) => team.kind === 'club');
  const nationalTeams = teams.filter(
    (team) => team.kind === 'national'
  );

  const usedIds = [
    national?.id,
    favoriteClub?.id,
    rivalClub?.id,
  ].filter(Boolean);

  const ready = Boolean(national && favoriteClub && rivalClub);

  return (
    <main className="shell">
      <header className="top">
        <div className="brand">
          <span className="ball">⚽</span>
          <span>RANDOM <b>FOOTBALL</b></span>
        </div>
        <span className="tag">WEB MVP · 0.2</span>
      </header>

      <section className="hero">
        <p className="eyebrow">ТВОЯ ИСТОРИЯ. ТВОЯ КОМАНДА.</p>
        <h1>
          Собери состав
          <br />
          <em>легенд футбола.</em>
        </h1>
        <p className="sub">
          Выбери три команды для своего футбольного драфта.
        </p>
      </section>

      <section className="draft">
        <div className="draftHead">
          <div>
            <p className="eyebrow">ШАГ 1 / 2</p>
            <h2>Выбор команд</h2>
          </div>
          <div className="counter">01<span> / 02</span></div>
        </div>

        {loading && <p>Загружаем команды...</p>}
        {error && <p>Ошибка загрузки: {error}</p>}

        {!loading && !error && (
          <>
            <div className="team-selector">
              <TeamField
                label="1. Любимая сборная"
                placeholder="Найти сборную..."
                teams={nationalTeams}
                selected={national}
                onSelect={setNational}
              />

              <TeamField
                label="2. Любимый клуб"
                placeholder="Найти клуб..."
                teams={clubs.filter(
                  (team) => team.id !== rivalClub?.id
                )}
                selected={favoriteClub}
                onSelect={setFavoriteClub}
              />

              <TeamField
                label="3. Клуб-соперник"
                placeholder="Найти клуб..."
                teams={clubs.filter(
                  (team) => team.id !== favoriteClub?.id
                )}
                selected={rivalClub}
                onSelect={setRivalClub}
              />
            </div>

            <div className="bottomActions">
              <span>
                Выбрано {usedIds.length} из 3 команд
              </span>

              <button
                className="primary"
                disabled={!ready}
                onClick={() => {
  if (!national || !favoriteClub || !rivalClub) return;

  const params = new URLSearchParams({
    national: national.id,
    favorite: favoriteClub.id,
    rival: rivalClub.id,
  });

  router.push(`/formations?${params.toString()}`);
}}
              >
                Начать драфт ↗
              </button>
            </div>
          </>
        )}
      </section>

      <footer>
        <span>RANDOM FOOTBALL © 2026</span>
        <span>Исторические футбольные легенды</span>
      </footer>
    </main>
  );
}
