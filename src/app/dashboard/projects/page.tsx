import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { listProjects } from '@/modules/m1-projets/queries/list-projects';

/**
 * Page liste des projets de l'utilisateur connecté.
 *
 * Route : /dashboard/projects
 * Route : /dashboard/projects?tests=1 pour inclure les projets « [E2E] … »
 *
 * Chaque projet est cliquable et mène à sa page détail.
 *
 * Les projets de test sont écartés par défaut, comme sur /dashboard/mesures :
 * ils sont masqués à la lecture, jamais supprimés.
 *
 * Protégée par vérification de session (auth.getUser()) en défense en
 * profondeur, en plus de l'allowlist du proxy (DT-Lot5-07).
 *
 * Next.js 16 : searchParams est une Promise (breaking change).
 */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Vérification de session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const includeTestProjects = params.tests === '1';

  const projects = await listProjects(includeTestProjects);

  return (
    <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1>Mes projets</h1>
        <Link
          href="/dashboard/projects/new"
          style={{
            padding: '0.5rem 1rem',
            background: '#0070f3',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          + Nouveau projet
        </Link>
      </div>

      {projects.length === 0 ? (
        <p style={{ color: '#666' }}>
          Aucun projet pour le moment. Créez votre premier projet.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {projects.map((project) => (
            <li
              key={project.id}
              style={{
                marginBottom: '1rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
              }}
            >
              <Link
                href={`/dashboard/projects/${project.id}`}
                style={{
                  display: 'block',
                  padding: '1rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <strong style={{ fontSize: '1.1rem' }}>{project.name}</strong>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      background:
                        project.status === 'Archivé' ? '#ddd' : '#e8f4ff',
                      fontSize: '0.85rem',
                    }}
                  >
                    {project.status}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                  {project.business_problem}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <footer
        style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #eee',
          fontSize: '0.8rem',
          color: '#666',
        }}
      >
        {includeTestProjects ? (
          <p style={{ margin: 0 }}>
            Les projets de test («&nbsp;[E2E]&nbsp;…&nbsp;») sont{' '}
            <strong>inclus</strong>.{' '}
            <Link href="/dashboard/projects" style={{ color: '#0070f3' }}>
              Revenir aux projets réels
            </Link>
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Les projets de test («&nbsp;[E2E]&nbsp;…&nbsp;») sont écartés de
            cette vue. Ils restent en base : le test E2E en recrée à chaque
            exécution, les masquer tient dans le temps, les effacer non.{' '}
            <Link href="/dashboard/projects?tests=1" style={{ color: '#0070f3' }}>
              Les afficher quand même
            </Link>
          </p>
        )}
      </footer>
    </main>
  );
}
