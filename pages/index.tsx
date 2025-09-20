import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import BlockForm from '../components/BlockForm';
import ProtectedRoute from '../components/ProtectedRoute';

interface Block {
  _id: string;
  title: string;
  start_time: string;
  end_time: string;
  user_email: string;
}

export default function Dashboard() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { signOut, session, getUserDisplayName } = useAuth();

  const fetchBlocks = useCallback(async () => {
    if (!session?.access_token) return;
    
    try {
      const res = await fetch('/api/blocks', {
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (session) {
      fetchBlocks();
    }
  }, [session, fetchBlocks]);

  const deleteBlock = async (id: string) => {
    if (!session?.access_token) return;

    try {
      const res = await fetch(`/api/blocks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        fetchBlocks(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  };

  const testEmail = async () => {
    if (!session?.access_token) return;

    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      
      if (res.ok) {
        alert('✅ Test email sent successfully! Check your inbox.');
      } else {
        alert(`❌ Email test failed: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Network error during email test');
      console.error('Email test error:', error);
    }
  };

  const testCron = async () => {
    if (!session?.access_token) return;

    try {
      const res = await fetch('/api/test-cron', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      
      if (res.ok) {
        const cronData = data.data;
        alert(`✅ CRON test completed!\n\nBlocks found: ${cronData.blocksFound}\nNotifications sent: ${cronData.notificationsSent}\nErrors: ${cronData.errors}\n\nTriggered by: ${data.triggeredBy}`);
      } else {
        alert(`❌ CRON test failed: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Network error during CRON test');
      console.error('CRON test error:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Quiet Hours Dashboard
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {getUserDisplayName()}
                </span>
                <button
                  onClick={signOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Create Block Button */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {showForm ? 'Cancel' : 'Create New Block'}
              </button>
              
              <button
                onClick={testEmail}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Test Email
              </button>
              
              <button
                onClick={testCron}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Test CRON
              </button>
            </div>

            {/* Block Form */}
            {showForm && (
              <div className="mb-8">
                <BlockForm
                  refresh={fetchBlocks}
                />
              </div>
            )}

            {/* Blocks List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Quiet Hour Blocks
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Manage your scheduled quiet hours.
                </p>
              </div>
              
              {loading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              )}
              
              {!loading && blocks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No quiet hour blocks created yet.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 text-indigo-600 hover:text-indigo-500"
                  >
                    Create your first block
                  </button>
                </div>
              )}
              
              {!loading && blocks.length > 0 && (
                <ul className="divide-y divide-gray-200">
                  {blocks.map((block) => (
                    <li key={block._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {block.title}
                          </h4>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">
                              <span className="text-gray-900">Start:</span> {new Date(block.start_time).toLocaleString()}
                            </p>
                            <p className="text-sm font-medium text-gray-700">
                              <span className="text-gray-900">End:</span> {new Date(block.end_time).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteBlock(block._id)}
                          className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
