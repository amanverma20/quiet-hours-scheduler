import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user first
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  try {
    // Call the CRON endpoint internally with the proper key
    const cronResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron`, {
      method: 'POST',
      headers: {
        'x-cron-key': process.env.CRON_SECRET_KEY || 'default-test-key',
        'Content-Type': 'application/json'
      }
    });

    const cronData = await cronResponse.json();

    if (cronResponse.ok) {
      console.log(`✅ CRON test triggered by user ${user.email}`);
      return res.json({
        success: true,
        message: 'CRON job executed successfully',
        data: cronData,
        triggeredBy: user.email,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ CRON test failed:', cronData);
      return res.status(cronResponse.status).json({
        success: false,
        error: cronData.error || 'CRON execution failed',
        details: cronData
      });
    }

  } catch (error) {
    console.error('💥 CRON test error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}