import { createClient } from '@supabase/supabase-js';
import { ObjectId } from 'mongodb';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../../lib/mongoClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(' ')[1];
  const { id } = req.query;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).end();

  const db = await connectDB();
  if (req.method === 'DELETE') {
    await db.collection('blocks').deleteOne({ 
      _id: new ObjectId(id as string), 
      user_id: user.id 
    });
    return res.json({ ok: true });
  }
  res.status(405).end();
}
