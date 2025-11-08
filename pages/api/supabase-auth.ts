// pages/api/supabase-auth.ts
import { supabase } from '../../src/lib/supabase'

export default supabase.auth.api.handleAuthRequest