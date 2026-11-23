
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FormationPreview from '@/components/FormationPreview';

type Formation = {
  id: string;
  code: string;
  name: string;
  positions: string[];
  is_active: boolean;
};

function FormationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selected, setSelected] = useState<string>('4-3-3');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFormations() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('formations')
        .select('id, code, name, positions, is_active')
        .eq('is_active', true)
        .order('code');

      if (error) {
        setError(error.message);
      } else {
        setFormations(data ?? []);
      }

      setLoading(false);
    }

    loadFormations();
  }, []);

  return (
    <main className="shell">
      <header className="top">
        <div className="brand">
          <span className="ball">⚽</span>
          <span>RANDOM <b>FOOTBALL</b></span>
        </div>
        <span className="tag">ШАГ 2 / 2</span>
      </header>

      <section className="hero">
        <p className="eyebrow">ТВОЯ ТАКТИКА</p>
        <h1>
          Выбери свою
          <br />
          <em>схему игры.</em>
        </h1>
        <p className="sub">
          Выбери расстановку из семи доступных тактических схем.
        </p>
      </section>

      <section className="draft">
        <div className="draftHead">
          <div>
            <p className="eyebrow">ТАКТИЧЕСКАЯ ДОСКА</p>
            <h2>Схемы игры</h2>
          </div>
          <div className="counter">
            {formations.length}
            <span> / 07</span>
          </div>
        </div>

        {loading && <p>Загружаем схемы...</p>}

        {error && (
          <p>Ошибка загрузки: {error}</p>
        )}

        {!loading && !error && (
          <>
            <div className="formation-grid">
              {formations.map((formation) => (
                <FormationPreview
                  key={formation.id}
                  code={formation.code}
                  positions={formation.positions}
                  selected={selected === formation.code}
                  onClick={() => setSelected(formation.code)}
                />
              ))}
            </div>

            <div className="bottomActions">
              <span>
                Выбрана схема {selected}
              </span>

              <button
                className="primary"
                onClick={() => {
  const params = new URLSearchParams(searchParams.toString());
  params.set('formation', selected);

  router.push(`/draft?${params.toString()}`);
}}
              >
                Подтвердить схему ↗
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

export default function FormationsPage() {
  return (
    <Suspense fallback={<main>Загрузка схем...</main>}>
      <FormationsContent />
    </Suspense>
  );
}
