import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectById } from '@/modules/m1-projets/queries/get-project-by-id';
import { archiveProject } from '@/modules/m1-projets/actions/archive-project';
import { canTransition } from '@/modules/m1-projets/domain/transitions';

/**
 * Page d'archivage d'un projet.
 *
 * Route : /dashboard/projects/[id]/archive
 *
 * Comportement :
 * - 404 si projet inexistant ou appartenant à un autre user (RLS)
 * - Si transition vers Archivé impossible depuis le statut actuel :
 *   affiche un message explicatif au lieu du formulaire
 * - Sinon : formulaire avec avertissement + textarea raison obligatoire
 *
 * Protégée par vérification de session (auth.getUser()) en défense en
 * profondeur, en plus de l'allowlist du proxy (DT-Lot5-07).
 */
export default async function ArchiveProjectPage({
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

  const canArchive = canTransition(project.status, 'Archivé');

  return (
    <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <nav style={{ marginBottom: '1.5rem' }}>
        <Link href={`/dashboard/projects/${project.id}`}>← Retour au projet</Link>
      </nav>

      <h1 style={{ marginBottom: '1rem' }}>Archiver le projet</h1>

      <p style={{ marginBottom: '1.5rem', color: '#333' }}>
        Projet : <strong>{project.name}</strong> — statut actuel :{' '}
        <strong>{project.status}</strong>
      </p>

      {!canArchive ? (
        <div
          style={{
            padding: '1rem',
            background: '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: '6px',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ margin: 0 }}>
            Ce projet ne peut pas être archivé depuis son statut actuel
            (<strong>{project.status}</strong>).
          </p>
          <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.9rem', color: '#666' }}>
            L&apos;archivage n&apos;est possible qu&apos;à partir des statuts
            <em> En cours</em>, <em>En pause</em> ou <em>Livré</em>.
            Voir <code>docs/methode/05.Cycle_de_Vie.md</code>.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              padding: '1rem',
              background: '#fff8e1',
              border: '1px solid #f0c040',
              borderRadius: '6px',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              ⚠️ L&apos;archivage est une action définitive et irréversible.
            </p>
            <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.9rem' }}>
              Une fois archivé, le projet ne pourra plus revenir à un autre statut.
              La raison d&apos;archivage sera conservée pour référence future.
            </p>
          </div>

          <form action={archiveProject}>
            <input type="hidden" name="id" value={project.id} />

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="reason"
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
              >
                Raison de l&apos;archivage
              </label>
              <textarea
                id="reason"
                name="reason"
                required
                rows={5}
                placeholder="Ex : projet abandonné faute de temps, remplacé par la V2, client désengagé, etc."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#c0392b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Archiver définitivement
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
        </>
      )}
    </main>
  );
}
