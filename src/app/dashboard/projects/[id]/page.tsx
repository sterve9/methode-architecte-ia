import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectById } from '@/modules/m1-projets/queries/get-project-by-id';
import { canTransition } from '@/modules/m1-projets/domain/transitions';

/**
 * Page détail d'un projet.
 *
 * Route : /dashboard/projects/[id]
 *
 * Comportement :
 * - 404 si projet inexistant ou appartenant à un autre user (RLS)
 * - Affichage lecture seule
 * - Bouton "Modifier" toujours visible
 * - Bouton "Archiver" visible uniquement si la transition vers Archivé
 *   est autorisée depuis le statut actuel (T6, T7, T8)
 * - Si projet archivé : affichage de la raison d'archivage
 */
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  const canArchive = canTransition(project.status, 'Archivé');
  const isArchived = project.status === 'Archivé';

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

  return (
    <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <nav style={{ marginBottom: '1.5rem' }}>
        <Link href="/dashboard/projects">← Retour à la liste</Link>
      </nav>

      <h1 style={{ marginBottom: '0.5rem' }}>{project.name}</h1>

      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Statut :{' '}
        <strong
          style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            background: isArchived ? '#ddd' : '#e8f4ff',
          }}
        >
          {project.status}
        </strong>
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          Problème métier résolu
        </h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{project.business_problem}</p>
      </section>

      {isArchived && project.archive_reason && (
        <section
          style={{
            marginBottom: '2rem',
            padding: '1rem',
            background: '#f5f5f5',
            border: '1px solid #ccc',
            borderRadius: '6px',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', marginTop: 0 }}>
            Raison de l&apos;archivage
          </h2>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{project.archive_reason}</p>
        </section>
      )}

      <section
        style={{
          marginBottom: '2rem',
          fontSize: '0.9rem',
          color: '#666',
        }}
      >
        <p>Créé le : {formatDate(project.created_at)}</p>
        <p>Dernière modification : {formatDate(project.updated_at)}</p>
      </section>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link
          href={`/dashboard/projects/${project.id}/edit`}
          style={{
            padding: '0.5rem 1rem',
            background: '#0070f3',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          Modifier
        </Link>

        {canArchive && (
          <Link
            href={`/dashboard/projects/${project.id}/archive`}
            style={{
              padding: '0.5rem 1rem',
              background: '#888',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            Archiver
          </Link>
        )}
      </div>
    </main>
  );
}
