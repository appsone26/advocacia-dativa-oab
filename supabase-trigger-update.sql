-- ============================================================
-- ADVOCACIA DATIVA — Atualização do trigger handle_new_user
-- Rodar UMA VEZ no SQL Editor do Supabase.
--
-- O QUE MUDA:
-- O trigger antigo copiava só nome, email e nivel para o profile.
-- Esta versão também copia municipio_id, oab_numero, cargo e
-- primeiro_acesso — todos vindos do raw_user_meta_data (o mesmo
-- objeto que vira user_metadata no JWT).
--
-- POR QUE:
-- Quando o gestor cadastrar um advogado, o município e o número
-- da OAB precisam ser gravados no profile. E o middleware precisa
-- do primeiro_acesso para forçar a troca de senha.
--
-- SEGURO: usa CREATE OR REPLACE — não apaga nada, só atualiza a
-- definição da função. As políticas RLS e o trigger em si continuam
-- apontando para esta função normalmente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nome,
    email,
    nivel,
    municipio_id,
    oab_numero,
    cargo,
    primeiro_acesso
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nivel', 'cliente'),
    NULLIF(NEW.raw_user_meta_data->>'municipio_id', '')::uuid,
    NEW.raw_user_meta_data->>'oab_numero',
    NEW.raw_user_meta_data->>'cargo',
    COALESCE((NEW.raw_user_meta_data->>'primeiro_acesso')::boolean, true)
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- COMO VERIFICAR QUE FUNCIONOU
-- Depois de rodar, confira a definição atualizada:
-- ============================================================

-- SELECT routine_definition
-- FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';
