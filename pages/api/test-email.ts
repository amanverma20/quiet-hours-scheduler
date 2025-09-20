import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { createQuietHourEmailTemplate, sendEmail } from '../../lib/sendEmail';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  try {
    // Get user name from metadata
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const userMetadata = userData?.user?.user_metadata;
    const userName = userMetadata?.name || userMetadata?.full_name || user.email?.split('@')[0] || 'User';

    // Create test email content
    const testStartTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const { text, html } = createQuietHourEmailTemplate(userName, 'Test Study Block', testStartTime);

    // Send test email
    await sendEmail(
      user.email!,
      '🧪 Test Notification: Quiet Study Reminder',
      text,
      html
    );

    console.log(`✅ Test email sent successfully to ${user.email}`);

    return res.json({
      success: true,
      message: 'Test email sent successfully',
      recipient: user.email,
      userName: userName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test email failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}