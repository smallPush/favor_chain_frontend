-- Estructura SQL para FavorChain Supabase
-- Puedes pegar todo esto en el 'SQL Editor' de tu dashboard de Supabase y ejecutarlo.

-- 1. Crear tabla de perfiles (almacena el karma total del usuario)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  user_name TEXT,
  karma INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, chat_id)
);

-- 2. Crear tabla de favores (almacena el historial y los puntos asignados)
CREATE TABLE IF NOT EXISTS public.favors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  description TEXT NOT NULL,
  karma_awarded INTEGER NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'NECESIDAD', -- 'NECESIDAD' o 'BRAIN'
  status TEXT NOT NULL DEFAULT 'PENDING',        -- 'PENDING' o 'COMPLETED'
  completed_by TEXT,                           -- Quién lo hizo (userId)
  original_input TEXT,                           -- Mensaje original antes de resumir
  ai_model TEXT,                                 -- Modelo de IA utilizado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  FOREIGN KEY (user_id, chat_id) REFERENCES public.profiles(user_id, chat_id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by, chat_id) REFERENCES public.profiles(user_id, chat_id)
);

-- 2b. MIGRACIONES (Ejecuta esto si ya tienes las tablas creadas para no perder datos):
-- 1. Añadir chat_id con valor por defecto 'global'
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_id TEXT NOT NULL DEFAULT 'global';
-- ALTER TABLE public.favors ADD COLUMN IF NOT EXISTS chat_id TEXT NOT NULL DEFAULT 'global';

-- 2. Actualizar claves de profiles (Requiere borrar primero las dependencias de favors)
-- ALTER TABLE public.favors DROP CONSTRAINT IF EXISTS favors_user_id_fkey;
-- ALTER TABLE public.favors DROP CONSTRAINT IF EXISTS favors_completed_by_fkey;
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
-- ALTER TABLE public.profiles ADD PRIMARY KEY (user_id, chat_id);

-- 3. Actualizar claves de favors y añadir columnas faltantes
-- ALTER TABLE public.favors ADD COLUMN IF NOT EXISTS original_input TEXT;
-- ALTER TABLE public.favors ADD COLUMN IF NOT EXISTS ai_model TEXT;
-- ALTER TABLE public.favors ADD CONSTRAINT favors_user_chat_fkey FOREIGN KEY (user_id, chat_id) REFERENCES public.profiles(user_id, chat_id) ON DELETE CASCADE;
-- ALTER TABLE public.favors ADD CONSTRAINT favors_completed_chat_fkey FOREIGN KEY (completed_by, chat_id) REFERENCES public.profiles(user_id, chat_id);

-- 3. Políticas de Seguridad (RLS - Permite al servidor leer y escribir sin problemas)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favors ENABLE ROW LEVEL SECURITY;

-- 4. Tabla para validaciones de encuestas (Polls)
CREATE TABLE IF NOT EXISTS public.favor_validations (
  poll_id TEXT PRIMARY KEY,
  favor_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  FOREIGN KEY (favor_id) REFERENCES public.favors(id) ON DELETE CASCADE
);

ALTER TABLE public.favor_validations ENABLE ROW LEVEL SECURITY;

-- Nota: Como estás accediendo desde un Backend con tu 'SUPABASE_KEY' (Service Role Key),
-- el backend siempre tendrá permiso total e ignorará el RLS.
-- Opcionalmente, puedes añadir políticas públicas si en el futuro decides que el frontend haga un select directo.

-- 5. Funciones RPC para actualizaciones atómicas (Mitigación de Race Conditions)
CREATE OR REPLACE FUNCTION save_favor_and_update_karma(
  p_user_id TEXT,
  p_chat_id TEXT,
  p_description TEXT,
  p_karma_awarded INTEGER,
  p_entry_type TEXT,
  p_original_input TEXT,
  p_ai_model TEXT,
  p_user_name TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Upsert profile con el karma actualizado
  INSERT INTO public.profiles (user_id, chat_id, karma, user_name)
  VALUES (p_user_id, p_chat_id, p_karma_awarded, p_user_name)
  ON CONFLICT (user_id, chat_id)
  DO UPDATE SET
    karma = public.profiles.karma + p_karma_awarded,
    user_name = COALESCE(p_user_name, public.profiles.user_name);

  -- Insert favor
  INSERT INTO public.favors (user_id, chat_id, description, karma_awarded, entry_type, status, original_input, ai_model)
  VALUES (p_user_id, p_chat_id, p_description, p_karma_awarded, p_entry_type, 'PENDING', p_original_input, p_ai_model);
END;
$$;

CREATE OR REPLACE FUNCTION complete_favor_and_update_karma(
  p_favor_id UUID,
  p_completed_by TEXT,
  p_karma_awarded INTEGER,
  p_chat_id TEXT,
  p_user_name TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Marcar favor como completado
  UPDATE public.favors
  SET status = 'COMPLETED', completed_by = p_completed_by
  WHERE id = p_favor_id;

  -- Upsert karma para el donante
  INSERT INTO public.profiles (user_id, chat_id, karma, user_name)
  VALUES (p_completed_by, p_chat_id, p_karma_awarded, p_user_name)
  ON CONFLICT (user_id, chat_id)
  DO UPDATE SET
    karma = public.profiles.karma + p_karma_awarded,
    user_name = COALESCE(p_user_name, public.profiles.user_name);
END;
$$;
