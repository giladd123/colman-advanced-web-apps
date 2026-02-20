import React from "react";
import { Container, Box, CircularProgress, Alert } from "@mui/material";
import PostList from "../components/PostList";
import { usePosts } from "../hooks/usePosts";

const Home: React.FC = () => {
  const { posts, users, likedPosts, loading, error, handleLike, handleEditPost, handleDeletePost, userId } = usePosts();

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
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            currentUserId={userId}
          />
        )}
      </Container>
    </Box>
  );
};

export default Home;
