-- Estructura SQL para FavorChain Supabase
-- Puedes pegar todo esto en el 'SQL Editor' de tu dashboard de Supabase y ejecutarlo.

-- 1. Crear tabla de perfiles (almacena el karma total del usuario)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id TEXT PRIMARY KEY,
  karma INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de favores (almacena el historial y los puntos asignados)
CREATE TABLE IF NOT EXISTS public.favors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  karma_awarded INTEGER NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'NECESIDAD', -- 'NECESIDAD' o 'BRAIN'
  status TEXT NOT NULL DEFAULT 'PENDING',        -- 'PENDING' o 'COMPLETED'
  completed_by TEXT REFERENCES public.profiles(user_id), -- Quién lo hizo
  original_input TEXT,                           -- Mensaje original antes de resumir
  ai_model TEXT,                                 -- Modelo de IA utilizado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2b. MIGRACIONES (Ejecuta esto si ya tienes las tablas creadas):
-- ALTER TABLE public.favors ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING';
-- ALTER TABLE public.favors ADD COLUMN IF NOT EXISTS completed_by TEXT REFERENCES public.profiles(user_id);
-- ALTER TABLE public.favors ADD COLUMN IF NOT EXISTS original_input TEXT;
-- ALTER TABLE public.favors ADD COLUMN IF NOT EXISTS ai_model TEXT;

-- 3. Políticas de Seguridad (RLS - Permite al servidor leer y escribir sin problemas)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favors ENABLE ROW LEVEL SECURITY;

-- Nota: Como estás accediendo desde un Backend con tu 'SUPABASE_KEY' (Service Role Key),
-- el backend siempre tendrá permiso total e ignorará el RLS.
-- Opcionalmente, puedes añadir políticas públicas si en el futuro decides que el frontend haga un select directo.
