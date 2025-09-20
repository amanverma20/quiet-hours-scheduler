import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../lib/mongoClient';
import { createQuietHourEmailTemplate, sendEmail } from '../../lib/sendEmail';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests for security (prevents accidental GET triggers)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Simple API key protection for CRON endpoint
  const cronKey = req.headers['x-cron-key'] || req.query.key;
  if (cronKey !== process.env.CRON_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔄 Starting CRON job execution at', new Date().toISOString());
  
  try {
    const db = await connectDB();
    const now = new Date();
    
    // Find blocks that start in 10 minutes (with 2-minute window for flexibility)
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    const windowStart = new Date(tenMinutesFromNow.getTime() - 60 * 1000); // 1 minute before
    const windowEnd = new Date(tenMinutesFromNow.getTime() + 60 * 1000);   // 1 minute after
    
    console.log(`🔍 Looking for blocks starting between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);
    console.log(`🔍 Local times: ${windowStart.toLocaleString()} - ${windowEnd.toLocaleString()}`);
    console.log(`🔍 Current time: ${now.toLocaleString()}`);
    
    const blocksToNotify = await db.collection('blocks').find({
      start_time: { $gte: windowStart, $lt: windowEnd },
      notification_sent: { $ne: true }
    }).toArray();
    
    console.log(`📧 Found ${blocksToNotify.length} blocks requiring notification`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const block of blocksToNotify) {
      try {
        // Use atomic update to prevent race conditions
        const updateResult = await db.collection('blocks').findOneAndUpdate(
          { 
            _id: block._id, 
            notification_sent: { $ne: true } // Double-check it hasn't been sent
          },
          { 
            $set: { 
              notification_sent: true, 
              notified_at: new Date(),
              notification_error: null
            } 
          },
          { returnDocument: 'after' }
        );
        
        // If update failed, another process already handled this notification
        if (!updateResult || !updateResult.value) {
          console.log(`⚠️  Block ${block._id} already processed by another instance`);
          continue;
        }
        
        // Get user details from Supabase for personalized email
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(block.user_id);
        
        let userName = 'User';
        if (!userError && userData?.user) {
          // Try to get name from user metadata, fallback to email
          const userMetadata = userData.user.user_metadata;
          userName = userMetadata?.name || userMetadata?.full_name || userData.user.email?.split('@')[0] || 'User';
        }
        
        // Create personalized email content
        const { text, html } = createQuietHourEmailTemplate(userName, block.title, new Date(block.start_time));
        
        // Send email notification
        await sendEmail(
          block.user_email,
          `🔔 Quiet Study Reminder: ${block.title}`,
          text,
          html
        );
        
        successCount++;
        console.log(`✅ Notification sent successfully for block "${block.title}" to ${block.user_email}`);
        
      } catch (emailError) {
        errorCount++;
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
        errors.push(`Block "${block.title}" (${block.user_email}): ${errorMessage}`);
        
        console.error(`❌ Failed to send notification for block "${block.title}":`, emailError);
        console.error(`❌ Email details - To: ${block.user_email}, From: ${process.env.EMAIL_FROM}`);
        console.error(`❌ SendGrid configured: ${!!process.env.SENDGRID_API_KEY}`);
        console.error(`❌ SMTP configured: ${!!process.env.SMTP_USER}`);
        
        // Mark the notification as failed so we can retry later
        await db.collection('blocks').updateOne(
          { _id: block._id },
          { 
            $set: { 
              notification_sent: false,
              notification_error: errorMessage,
              last_notification_attempt: new Date()
            } 
          }
        );
      }
    }
    
    const result = {
      success: true,
      timestamp: now.toISOString(),
      blocksFound: blocksToNotify.length,
      notificationsSent: successCount,
      errors: errorCount,
      errorDetails: errors
    };
    
    console.log('✅ CRON job completed:', result);
    
    return res.json(result);
    
  } catch (error) {
    console.error('💥 CRON job failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
