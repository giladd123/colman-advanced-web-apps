import React from "react";
import { Box } from "@mui/material";
import PostCard from "./PostCard";
import type { PostListProps } from "../types/post";

const PostList: React.FC<PostListProps> = ({ posts, users, likedPosts, onLike, currentUserId, onEdit, onDelete }) => {
  return (
    <Box sx={{ width: "100%" }}>
      {posts.map((post) => {
        const user = users.find(u => u._id === post.userID)
        return (
          <PostCard
            key={post._id}
            post={post}
            user={user}
            isLiked={likedPosts.has(post._id)}
            onLike={onLike}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}
    </Box>
  );
};

export default PostList;
