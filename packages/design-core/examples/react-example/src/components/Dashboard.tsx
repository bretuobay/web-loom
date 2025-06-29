import React, { useEffect, useState } from 'react';
import { EndpointState } from 'query-core-client';
import { queryCore, fetchPosts, POSTS_ENDPOINT_KEY, Post } from '../queryClient';

interface UserPostCounts {
  [userId: number]: number;
}

const Dashboard: React.FC = () => {
  const [postsState, setPostsState] = useState<EndpointState<Post[]>>({
    data: undefined,
    isLoading: true,
    isError: false,
    error: undefined,
    lastUpdated: undefined,
  });

  const [userPostCounts, setUserPostCounts] = useState<UserPostCounts>({});

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function setupEndpoint() {
      // Define the endpoint (it might have been defined elsewhere, QueryCore handles re-definition gracefully)
      await queryCore.defineEndpoint<Post[]>(POSTS_ENDPOINT_KEY, fetchPosts);

      // Subscribe to the endpoint
      unsubscribe = queryCore.subscribe<Post[]>(POSTS_ENDPOINT_KEY, (state) => {
        setPostsState(state);
        if (state.data) {
          const counts: UserPostCounts = {};
          state.data.forEach((post) => {
            counts[post.userId] = (counts[post.userId] || 0) + 1;
          });
          setUserPostCounts(counts);
        }
      });

      // Initial fetch if not already loading or data not present
      const currentState = queryCore.getState<Post[]>(POSTS_ENDPOINT_KEY);
      if (!currentState.isLoading && !currentState.data) {
        queryCore.refetch<Post[]>(POSTS_ENDPOINT_KEY);
      }
    }

    setupEndpoint();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (postsState.isLoading) {
    return <div className="text-center mt-2">Loading dashboard data...</div>;
  }

  if (postsState.isError) {
    return (
      <div className="text-center mt-2 error-message">
        Error loading dashboard: {postsState.error?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="card">
        <h2 className="card-title">Total Posts</h2>
        <div className="card-content dashboard-total-posts">
          {postsState.data ? <p>{postsState.data.length} posts</p> : <p>0</p>}
        </div>
      </div>
      <div className="card">
        <h2 className="card-title">Posts per User</h2>
        <div className="card-content">
          {Object.keys(userPostCounts).length > 0 ? (
            <ul className="list">
              {Object.entries(userPostCounts).map(([userId, count]) => (
                <li key={userId}>
                  User ID {userId}: {count} posts
                </li>
              ))}
            </ul>
          ) : (
            <p>No user post data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
