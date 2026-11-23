
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SupabaseTest() {
  const [result, setResult] = useState('Проверяем подключение...');

  useEffect(() => {
    async function testConnection() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('teams')
        .select('name, kind');

      if (error) {
        setResult('Ошибка: ' + error.message);
        return;
      }

      setResult(
        'Подключение успешно! Команды: ' +
        data.map((team) => team.name).join(', ')
      );
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: 40, fontSize: 20 }}>
      <h1>Тест Supabase</h1>
      <p>{result}</p>
    </main>
  );
}
