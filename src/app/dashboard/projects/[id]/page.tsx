import Link from 'next/link'
import { notFound } from 'next/navigation'

import { canTransition } from '@/modules/m1-projets/domain/transitions'
import { getProjectById } from '@/modules/m1-projets/queries/get-project-by-id'
import { getProjectDeliverables } from '@/modules/m2-methode/queries/get-project-deliverables'
import { getProjectSteps } from '@/modules/m2-methode/queries/get-project-steps'
import { MethodStepStatus } from '@/modules/m2-methode/types'
import { AddDeliverableForm } from '@/modules/m2-methode/ui/add-deliverable-form'
import { DeliverableItem } from '@/modules/m2-methode/ui/deliverable-item'
import { StepStatusButton } from '@/modules/m2-methode/ui/step-status-button'

/**
 * Page détail d'un projet.
 *
 * Route : /dashboard/projects/[id]
 */

function getStatusBadgeStyle(status: MethodStepStatus) {
  switch (status) {
    case 'Terminée':
      return { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }
    case 'En cours':
      return { background: '#fff8e1', color: '#b78103', border: '1px solid #ffe082' }
    case 'À faire':
    default:
      return { background: '#f5f5f5', color: '#616161', border: '1px solid #e0e0e0' }
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProjectById(id)

  if (!project) {
    notFound()
  }

  const steps = await getProjectSteps(project.id)
  const deliverables = await getProjectDeliverables(project.id)

  const canArchive = canTransition(project.status, 'Archivé')
  const isArchived = project.status === 'Archivé'

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    })

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
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

      {/* Section M2 - Étapes de la méthode */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          Étapes de la Méthode ({steps.length})
        </h2>

        {steps.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>
            Aucune étape rattachée à ce projet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {steps.map((step) => {
              const badgeStyle = getStatusBadgeStyle(step.status)
              const stepDeliverables = deliverables.filter((d) => d.step_id === step.id)

              return (
                <div
                  key={step.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #eaeaea',
                    borderRadius: '8px',
                    background: '#fafafa',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {step.step_order}. {step.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          ...badgeStyle,
                        }}
                      >
                        {step.status}
                      </span>
                      <StepStatusButton stepId={step.id} currentStatus={step.status} />
                    </div>
                  </div>

                  {step.description && (
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#555' }}>
                      {step.description}
                    </p>
                  )}

                  {/* Sous-section Livrables rattachés à cette étape */}
                  <div
                    style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px dashed #e0e0e0',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#444' }}>
                      Livrables ({stepDeliverables.length})
                    </div>

                    {stepDeliverables.map((deliv) => (
                      <DeliverableItem key={deliv.id} deliverable={deliv} />
                    ))}

                    <AddDeliverableForm stepId={step.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

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
  )
}
