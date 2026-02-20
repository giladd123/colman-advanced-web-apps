import { useState, useEffect, useCallback } from "react";
import type { Post } from "../types/post";
import type { User } from "../types/user";
import { useAuth } from "../context/useAuth";
import { getUserIdFromToken } from "../utils/usersUtil";
import { apiClient } from "../services/api";

export function usePosts(userID?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();
  const userId = getUserIdFromToken(accessToken);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const postsUrl = userID ? `/posts?userID=${userID}` : `/posts`;
      const [postsResp, usersResp] = await Promise.all([
        apiClient.get<Post[]>(postsUrl),
        apiClient.get<User[]>(`/users`),
      ]);
      setPosts(postsResp.data);
      setUsers(usersResp.data);
      const liked = postsResp.data
        .filter((p) => p.likes.includes(userId || ""))
        .map((p) => p._id);
      setLikedPosts(new Set(liked));
    } catch {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [userID, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return { posts, users, likedPosts, loading, error, handleLike, handleEditPost, handleDeletePost, userId, setUsers };
}
