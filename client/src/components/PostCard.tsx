import React, { useState, useRef } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useNavigate } from "react-router-dom";
import type { PostCardProps } from "../types/post";

const PostCard: React.FC<PostCardProps> = ({
  post,
  user,
  isLiked,
  onLike,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentUserId != null && currentUserId === post.userID;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(post._id);
  };

  const handleCommentsClick = () => {
    navigate(`/posts/${post._id}/comments`);
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setEditImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditContent(post.content);
    setEditImagePreview(null);
    setEditSelectedFile(null);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(post._id, editContent.trim(), editSelectedFile ?? undefined);
      setEditDialogOpen(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(post._id);
      setDeleteDialogOpen(false);
    }
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

  // The image to show in the edit dialog: new preview > existing post image > none
  const editDisplayImage = editImagePreview || post.image || null;

  return (
    <>
      <Paper
        variant="outlined"
        onClick={handleCommentsClick}
        sx={{
          mb: 1,
          display: "flex",
          borderRadius: 1,
          overflow: "hidden",
          "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
          transition: "border-color 0.15s, background-color 0.15s",
          cursor: "pointer",
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
              onClick={(e) => {
                e.stopPropagation();
                handleCommentsClick();
              }}
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

            {isOwner && (
              <Box sx={{ ml: "auto", display: "flex", gap: 0.25 }}>
                <Tooltip title="Edit post">
                  <IconButton
                    size="small"
                    onClick={handleEditOpen}
                    sx={{ p: 0.5, color: "text.secondary" }}
                  >
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete post">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                    sx={{ p: 0.5, color: "text.secondary" }}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
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

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent>
          {/* Image upload area */}
          <Box
            onClick={() => editFileInputRef.current?.click()}
            sx={{
              width: "100%",
              height: 200,
              border: "2px dashed",
              borderColor: editDisplayImage ? "transparent" : "grey.400",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              mt: 1,
              mb: 2,
              "&:hover": {
                borderColor: editDisplayImage ? "transparent" : "#2563eb",
              },
            }}
          >
            {editDisplayImage ? (
              <Box
                component="img"
                src={editDisplayImage}
                alt="Preview"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: "grey.500",
                }}
              >
                <AddPhotoAlternateIcon sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body2">
                  Click to upload an image
                </Typography>
              </Box>
            )}
          </Box>
          <input
            ref={editFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            hidden
            onChange={handleEditFileSelect}
          />

          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={!editContent.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostCard;
