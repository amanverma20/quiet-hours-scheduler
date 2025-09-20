import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/mongoClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  const db = await connectDB();
  
  if (req.method === 'POST') {
    const { title, start_time, end_time } = req.body;
    
    // Validate input
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: 'Title, start_time, and end_time are required' });
    }
    
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    
    // Validate dates
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Allow blocks to be created up to 1 minute in the past to account for form submission delays
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (startDate < oneMinuteAgo) {
      return res.status(400).json({ error: 'Cannot create blocks more than 1 minute in the past' });
    }
    
    // Check for overlapping blocks for this user
    const overlappingBlocks = await db.collection('blocks').find({
      user_id: user.id,
      $or: [
        // New block starts during existing block
        {
          start_time: { $lte: startDate },
          end_time: { $gt: startDate }
        },
        // New block ends during existing block
        {
          start_time: { $lt: endDate },
          end_time: { $gte: endDate }
        },
        // New block completely contains existing block
        {
          start_time: { $gte: startDate },
          end_time: { $lte: endDate }
        },
        // Existing block completely contains new block
        {
          start_time: { $lte: startDate },
          end_time: { $gte: endDate }
        }
      ]
    }).toArray();
    
    if (overlappingBlocks.length > 0) {
      const conflictTimes = overlappingBlocks.map(block => 
        `"${block.title}" (${new Date(block.start_time).toLocaleString()} - ${new Date(block.end_time).toLocaleString()})`
      ).join(', ');
      
      return res.status(409).json({ 
        error: 'Time conflict detected', 
        message: `This time slot overlaps with existing blocks: ${conflictTimes}`,
        conflictingBlocks: overlappingBlocks
      });
    }
    
    // Create new block
    const doc = {
      user_id: user.id,
      user_email: user.email,
      title: title.trim(),
      start_time: startDate,
      end_time: endDate,
      notification_sent: false,
      notification_scheduled: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('blocks').insertOne(doc);
    const insertedDoc = { ...doc, _id: result.insertedId };
    
    console.log(`✅ Created block "${title}" for user ${user.email}: ${startDate.toLocaleString()} - ${endDate.toLocaleString()}`);
    
    return res.json(insertedDoc);
  }
  
  if (req.method === 'GET') {
    const blocks = await db.collection('blocks')
      .find({ user_id: user.id })
      .sort({ start_time: 1 })
      .toArray();
    return res.json(blocks);
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
