import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectById } from '@/modules/m1-projets/queries/get-project-by-id';
import { updateProject } from '@/modules/m1-projets/actions/update-project';
import { getAvailableTransitions } from '@/modules/m1-projets/domain/transitions';

/**
 * Page d'édition d'un projet.
 *
 * Route : /dashboard/projects/[id]/edit
 *
 * Comportement :
 * - Si le projet n'existe pas OU appartient à un autre user (RLS) → 404
 * - Sinon : formulaire pré-rempli
 * - Le select de statut ne montre que les transitions autorisées
 * - Si le projet est archivé : nom/description modifiables, statut immuable
 *
 * Protégée par vérification de session (auth.getUser()) en défense en
 * profondeur, en plus de l'allowlist du proxy (DT-Lot5-07).
 */
export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Vérification de session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const isArchived = project.status === 'Archivé';
  const availableStatuses = getAvailableTransitions(project.status);

  return (
    <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <nav style={{ marginBottom: '1.5rem' }}>
        <Link href={`/dashboard/projects/${project.id}`}>← Retour au projet</Link>
      </nav>

      <h1 style={{ marginBottom: '1.5rem' }}>Modifier le projet</h1>

      <form action={updateProject}>
        <input type="hidden" name="id" value={project.id} />

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="name"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
          >
            Nom du projet
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={project.name}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="business_problem"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
          >
            Problème métier résolu
          </label>
          <textarea
            id="business_problem"
            name="business_problem"
            required
            rows={5}
            defaultValue={project.business_problem}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label
            htmlFor="status"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
          >
            Statut
          </label>

          {isArchived ? (
            <>
              <input type="hidden" name="status" value={project.status} />
              <p style={{ margin: 0, color: '#666' }}>
                <strong>Archivé</strong> — ce statut est terminal et ne peut plus être modifié.
              </p>
            </>
          ) : (
            <select
              id="status"
              name="status"
              defaultValue={project.status}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
              }}
            >
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Enregistrer
          </button>

          <Link
            href={`/dashboard/projects/${project.id}`}
            style={{
              padding: '0.5rem 1rem',
              background: '#eee',
              color: '#333',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            Annuler
          </Link>
        </div>
      </form>
    </main>
  );
}
