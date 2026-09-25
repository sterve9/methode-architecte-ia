/**
 * Anatomie d'une étude de cas (SPEC-p S5, D1).
 *
 * Annonce au visiteur ce qu'il trouvera sur chaque fiche /p/[slug]. Les
 * quatre blocs reprennent ceux de la fiche : le problème, ce qui a été
 * construit, le résultat, puis la preuve (vidéo ou système visible).
 */
const PARTS = [
  {
    number: '01',
    title: 'Problème',
    description: 'Ce qui coûtait du temps ou des clients, dit simplement.',
  },
  {
    number: '02',
    title: "Ce que j'ai construit",
    description: 'Le système livré, expliqué en clair.',
  },
  {
    number: '03',
    title: 'Résultat',
    description: 'Le gain obtenu, chiffré quand la donnée existe.',
  },
  {
    number: '04',
    title: 'Preuve',
    description: 'Le système en action : démonstration vidéo ou accès direct.',
  },
]

export function CaseAnatomy() {
  return (
    <section className="px-5 pb-16 sm:pb-20">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
          Ce que contient chaque étude de cas
        </h2>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTS.map((part) => (
            <li
              key={part.number}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <span className="text-sm font-bold text-accent">{part.number}</span>
              <h3 className="mt-2 text-base font-bold">{part.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {part.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
