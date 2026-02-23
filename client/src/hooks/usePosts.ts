import { useState, useEffect, useCallback, useRef } from "react";
import type { Post } from "../types/post";
import type { User } from "../types/user";
import { useAuth } from "../context/useAuth";
import { getUserIdFromToken } from "../utils/usersUtil";
import { apiClient } from "../services/api";

const PAGE_SIZE = 5;

type PaginatedPostsResponse = {
  data: Post[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export function usePosts(userID?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const { accessToken } = useAuth();
  const userId = getUserIdFromToken(accessToken);

  const fetchPage = useCallback(async (page: number, append: boolean) => {
    const postsUrl = userID
      ? `/posts?userID=${userID}&page=${page}&limit=${PAGE_SIZE}`
      : `/posts?page=${page}&limit=${PAGE_SIZE}`;

    const [postsResp, usersResp] = await Promise.all([
      apiClient.get<PaginatedPostsResponse>(postsUrl),
      page === 1 ? apiClient.get<User[]>(`/users`) : Promise.resolve(null),
    ]);

    const { data, hasMore: more } = postsResp.data;

    setPosts((prev) => {
      const updated = append ? [...prev, ...data] : data;
      const liked = updated
        .filter((p) => p.likes.includes(userId || ""))
        .map((p) => p._id);
      setLikedPosts(new Set(liked));
      return updated;
    });
    setHasMore(more);

    if (usersResp) {
      setUsers(usersResp.data);
    }
  }, [userID, userId]);

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);
    pageRef.current = 1;
    try {
      await fetchPage(1, false);
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [userID, userId]);

  useEffect(() => {
    fetchData();
  }, [userID, userId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      await fetchPage(nextPage, true);
      pageRef.current = nextPage;
    } catch {
      setError("Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, fetchPage]);

  const handleLike = async (postId: string) => {
    try {
      await apiClient.post(`/posts/${postId}/like`, {});
      await fetchData();
    } catch {
      setError("Failed to like post");
    }
  };

  const handleEditPost = async (postId: string, content: string, image?: File) => {
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (image) {
        formData.append("image", image);
      }
      await apiClient.put(`/posts/${postId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchData();
    } catch {
      setError("Failed to edit post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await apiClient.delete(`/posts/${postId}`);
      await fetchData();
    } catch {
      setError("Failed to delete post");
    }
  };

  return { posts, users, likedPosts, loading, loadingMore, hasMore, loadMore, error, handleLike, handleEditPost, handleDeletePost, userId, setUsers };
}
