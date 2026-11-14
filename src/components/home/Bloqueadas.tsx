export function Bloqueadas({ items }: { items: any[] }) {
  if (items.length === 0) return null;
  const dias = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

  return (
    <section className="mb-9 p-5 bg-[#F7EDE3] border-l-[3px] border-terra">
      <h2 className="label-mono !text-terra mb-3 !tracking-[0.14em]">Aguardando terceiros</h2>
      <ul>
        {items.map((b) => (
          <li key={b.id} className="py-2.5 border-b border-dotted border-[#E0C8B0] last:border-0 last:pb-0 text-[14.5px]">
            {b.titulo}{b.obras?.nome && <span className="text-ink dark:text-dark-ink-soft dark:text-dark-inkSoft"> — {b.obras.nome}</span>}
            <span className="block label-mono mt-1">há {dias(b.created_at)} dias</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
