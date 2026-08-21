-- Migration : Fonction RPC create_project_with_steps
-- Date : 2026-08-21
-- Description : Création atomique d'un projet avec clonage des étapes du canevas actif

CREATE OR REPLACE FUNCTION create_project_with_steps(
  p_name TEXT,
  p_business_problem TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID;
  v_version_id UUID;
  v_project_id UUID;
BEGIN
  -- 1. Vérifier l'authentification
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- 2. Récupérer la version de méthode active
  SELECT id INTO v_version_id
  FROM method_versions
  WHERE is_active = TRUE
  LIMIT 1;

  IF v_version_id IS NULL THEN
    RAISE EXCEPTION 'Aucune version de méthode active trouvée';
  END IF;

  -- 3. Insérer le projet
  INSERT INTO projects (user_id, name, business_problem, version_id)
  VALUES (v_user_id, p_name, p_business_problem, v_version_id)
  RETURNING id INTO v_project_id;

  -- 4. Cloner les 13 étapes du canevas
  INSERT INTO method_steps (project_id, template_step_id, step_order, title, description, status)
  SELECT
    v_project_id,
    id AS template_step_id,
    step_order,
    title,
    description,
    'À faire'
  FROM method_version_steps
  WHERE version_id = v_version_id
  ORDER BY step_order ASC;

  RETURN v_project_id;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION create_project_with_steps(TEXT, TEXT) TO authenticated;
