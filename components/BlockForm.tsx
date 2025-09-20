'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface BlockFormProps {
  readonly refresh: () => void;
}

export default function BlockForm({ refresh }: BlockFormProps) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function createBlock() {
    if (!title.trim() || !start || !end) {
      setError('Please fill in all fields');
      return;
    }
    
    if (new Date(start) >= new Date(end)) {
      setError('End time must be after start time');
      return;
    }
    
    // Allow blocks to be created up to 1 minute in the past to account for form delays
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (new Date(start) < oneMinuteAgo) {
      setError('Cannot create blocks more than 1 minute in the past');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ title, start_time: start, end_time: end })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTitle('');
        setStart('');
        setEnd('');
        setError('');
        refresh();
      } else {
        setError(data.message || data.error || 'Failed to create block');
      }
    } catch (err) {
      console.error('Block creation error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Quiet Hour Block</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="Enter block title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>
        
        <div>
          <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            id="start"
            type="datetime-local"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>
        
        <div>
          <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            id="end"
            type="datetime-local"
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>
        
        <div className="pt-2">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <button
            onClick={createBlock}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Creating...' : 'Create Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
