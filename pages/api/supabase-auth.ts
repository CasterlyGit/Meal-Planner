// pages/api/supabase-auth.ts
import { supabase } from '../../src/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await supabase.auth.api.handleAuthRequest(req, res)
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}