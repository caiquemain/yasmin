'use client';
import { useEffect, useState } from 'react';

export function Greeting({ nome }: { nome: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return <div className="h-[72px]" />;

  const h = now.getHours();
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const data = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <header className="mb-8">
      <h1 className="font-serif text-4xl md:text-5xl text-petrol-deep leading-none tracking-tight">{saudacao}, {nome}</h1>
      <p className="label-mono mt-3 !tracking-[0.12em]">{data}</p>
    </header>
  );
}
