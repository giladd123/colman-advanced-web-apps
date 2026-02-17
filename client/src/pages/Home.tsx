import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Box, CircularProgress, Alert } from "@mui/material";
import PostList from "../components/PostList";
import type { Post } from "../types/post";
import type { User } from "../types/user";
import { useAuth } from "../context/useAuth";
import { getUserIdFromToken } from "../utils/usersUtil";
import API_BASE_URL from "../config/api";

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postsResp, usersResp] = await Promise.all([
          axios.get<Post[]>(`${API_BASE_URL}/posts`),
          axios.get<User[]>(`${API_BASE_URL}/users`),
        ]);
        setPosts(postsResp.data.reverse?.() || postsResp.data);
        setUsers(usersResp.data);
        const userId = getUserIdFromToken(accessToken);
        const likedPosts = postsResp.data
          .filter((p) => p.likes.includes(userId || ""))
          .map((p) => p._id);
        setLikedPosts(new Set(likedPosts));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              likesCount: p.likesCount + (likedPosts.has(postId) ? -1 : 1),
            }
          : p,
      ),
    );

    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });

    try {
      await axios.post(
        `${API_BASE_URL}/posts/${postId}/like`,
        {},
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
        },
      );
    } catch (error) {
      // revert on failure
      console.error(error);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likesCount: p.likesCount + (likedPosts.has(postId) ? 1 : -1),
              }
            : p,
        ),
      );
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) next.delete(postId);
        else next.add(postId);
        return next;
      });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Container
        maxWidth="lg"
        sx={{
          py: 3,
          flex: 1,
          overflowY: "auto",
          maxHeight: "calc(100vh - 64px)",
        }}
      >
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!loading && !error && (
          <PostList
            users={users}
            posts={posts}
            likedPosts={likedPosts}
            onLike={handleLike}
          />
        )}
      </Container>
    </Box>
  );
};

export default Home;
