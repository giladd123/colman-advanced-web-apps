import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Box,
  IconButton,
  CardMedia,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useNavigate } from "react-router-dom";
import type { PostCardProps } from "../types/post";


const PostCard: React.FC<PostCardProps> = ({ post, user, isLiked, onLike }) => {
  const navigate = useNavigate();

  const handleLikeClick = () => {
    onLike(post._id);
  };

  const handleCommentsClick = () => {
    navigate(`/posts/${post._id}/comments`);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };



  return (
    <Card sx={{ mb: 2, boxShadow: 1 }}>
      <CardHeader
        avatar={
          <Avatar
            alt={user?.username || "User"}
            src={user?.profileImage || ""}
            sx={{ bgcolor: "#1976d2" }}
          >
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </Avatar>
        }
        title={user?.username || "Anonymous"}
        subheader={formatDate(post.createdAt)}
      />

      {post.image && (
        <CardMedia
          component="img"
          height="300"
          image={post.image}
          alt="Post image"
        />
      )}

      <CardContent>
        <Typography variant="body2" color="textPrimary" sx={{ mb: 2 }}>
          {post.content}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={handleLikeClick}
            sx={{
              color: isLiked ? "#e53935" : "inherit",
              transition: "color 0.3s ease",
            }}
          >
            {isLiked ? (
              <FavoriteIcon fontSize="small" />
            ) : (
              <FavoriteBorderIcon fontSize="small" />
            )}
          </IconButton>
          <Typography variant="caption" color="textSecondary">
            {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
          </Typography>

          <Box sx={{ width: 8 }} />

          <IconButton size="small" onClick={handleCommentsClick} aria-label="comments">
            <ChatBubbleOutlineIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="textSecondary">
            {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PostCard;
