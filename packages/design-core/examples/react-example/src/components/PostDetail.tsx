import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EndpointState } from 'query-core-client';
import { queryCore, fetchPostById, POST_DETAIL_ENDPOINT_KEY_PREFIX, Post } from '../queryClient';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [postState, setPostState] = useState<EndpointState<Post>>({
    data: undefined,
    isLoading: true,
    isError: false,
    error: undefined,
    lastUpdated: undefined,
  });

  const postDetailEndpointKey = id ? `${POST_DETAIL_ENDPOINT_KEY_PREFIX}${id}` : '';

  useEffect(() => {
    if (!id) {
      setPostState({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Post ID is missing'),
        lastUpdated: undefined,
      });
      return;
    }

    let unsubscribe: (() => void) | undefined;

    async function setupEndpoint() {
      // Define the endpoint for this specific post
      await queryCore.defineEndpoint<Post>(
        postDetailEndpointKey,
        () => fetchPostById(id as string), // id is checked above
      );

      // Subscribe to the endpoint
      unsubscribe = queryCore.subscribe<Post>(postDetailEndpointKey, (state) => {
        setPostState(state);
      });

      // Initial fetch if not already loading or data not present
      const currentState = queryCore.getState<Post>(postDetailEndpointKey);
      if (!currentState.isLoading && !currentState.data) {
        queryCore.refetch<Post>(postDetailEndpointKey);
      }
    }

    setupEndpoint();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Optional: Invalidate or clean up the specific post detail endpoint if not needed globally
      // queryCore.invalidate(postDetailEndpointKey);
    };
  }, [id, postDetailEndpointKey]);

  if (!id) {
    return <div className="text-center mt-2 error-message">Error: Post ID is missing.</div>;
  }

  if (postState.isLoading) {
    return <div className="text-center mt-2">Loading post details for ID: {id}...</div>;
  }

  if (postState.isError) {
    return <div className="text-center mt-2 error-message">Error fetching post {id}: {postState.error?.message || 'Unknown error'}</div>;
  }

  if (!postState.data) {
    return <p className="text-center mt-2">No post details found for ID: {id}.</p>;
  }

  return (
    <div className="post-detail-container">
      <h1>{postState.data.title}</h1>
      <p>{postState.data.body}</p>
      <small className="post-meta">User ID: {postState.data.userId}</small>
      <small className="post-meta">Post ID: {postState.data.id}</small>
    </div>
  );
};

export default PostDetail;
