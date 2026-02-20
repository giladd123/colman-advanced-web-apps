import React from "react";
import {
  Avatar,
  Box,
  IconButton,
  Paper,
  Tooltip,
  Typography,
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 1,
        display: "flex",
        borderRadius: 1,
        overflow: "hidden",
        "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        transition: "border-color 0.15s, background-color 0.15s",
        cursor: "default",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          px: 1,
          py: 1.5,
          bgcolor: "action.hover",
          borderRight: "1px solid",
          borderColor: "divider",
          minWidth: 52,
          gap: 0.25,
        }}
      >
        <Tooltip title={isLiked ? "Unlike" : "Like"}>
          <IconButton
            size="small"
            onClick={handleLikeClick}
            sx={{
              color: isLiked ? "#e53935" : "text.secondary",
              transition: "color 0.2s",
              p: 0.5,
            }}
          >
            {isLiked ? (
              <FavoriteIcon sx={{ fontSize: 16 }} />
            ) : (
              <FavoriteBorderIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Tooltip>
        <Typography
          variant="caption"
          fontWeight={600}
          color={isLiked ? "#e53935" : "text.secondary"}
          lineHeight={1}
        >
          {post.likesCount}
        </Typography>

        <Box sx={{ mt: 1.5 }} />

        <Tooltip title="View comments">
          <IconButton
            size="small"
            onClick={handleCommentsClick}
            sx={{ color: "text.secondary", p: 0.5 }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" color="text.secondary" lineHeight={1}>
          {post.commentsCount}
        </Typography>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, p: 1.5, minWidth: 0 }}>
        {/* Meta row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
          <Avatar
            alt={user?.username || "User"}
            src={user?.profileImage || ""}
            sx={{
              width: 20,
              height: 20,
              fontSize: 11,
              bgcolor: "primary.main",
            }}
          >
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </Avatar>
          <Typography variant="caption" fontWeight={600} color="text.primary">
            {user?.username || "Anonymous"}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            ·
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {formatDate(post.createdAt)}
          </Typography>
        </Box>

        {/* Content */}
        <Typography
          variant="body2"
          color="text.primary"
          sx={{
            fontFamily: "monospace",
            fontSize: "0.8rem",
            lineHeight: 1.55,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            mb: post.image ? 1 : 0,
          }}
        >
          {post.content}
        </Typography>

        {/* Thumbnail image */}
        {post.image && (
          <Box
            component="img"
            src={post.image}
            alt="Post image"
            sx={{
              display: "block",
              maxHeight: 120,
              maxWidth: 200,
              borderRadius: 0.5,
              border: "1px solid",
              borderColor: "divider",
              objectFit: "cover",
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

export default PostCard;
