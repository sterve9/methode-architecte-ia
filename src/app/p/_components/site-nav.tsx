import Image from 'next/image'

/**
 * Nav collante de la vitrine (SPEC-p S1, D4, D5).
 *
 * Chaque lien est une ancre vers une section de /p : pas de route à part,
 * donc de simples <a>. Les sections ciblées portent un `scroll-mt-*` pour ne
 * pas finir cachées sous cette barre après le saut (voir la doc de <Link>,
 * « Scroll offset with sticky headers »).
 */
const NAV_LINKS = [
  { label: 'Études de cas', href: '#cas' },
  { label: 'Services', href: '#services' },
  { label: 'À propos', href: '#demarche' },
  { label: 'Contact', href: '#contact' },
]

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3"
      >
        <a href="#haut" className="shrink-0">
          <Image
            src="/logo-sterveshop.png"
            alt="Sterveshop"
            width={36}
            height={36}
            loading="eager"
            className="h-9 w-auto"
          />
        </a>

        {/* Sur mobile, les liens passent sur une seconde ligne pleine largeur. */}
        <ul className="order-last flex w-full justify-between text-sm font-medium text-slate-600 sm:order-none sm:w-auto sm:justify-start sm:gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-accent">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Discutons de votre projet
        </a>
      </nav>
    </header>
  )
}
