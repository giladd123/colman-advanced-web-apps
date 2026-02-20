import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  TextField,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import type { User } from "../types/user";
import type { Post } from "../types/post";
import { useAuth } from "../context/useAuth";
import { getUserIdFromToken } from "../utils/usersUtil";
import { apiClient } from "../services/api";

const COMMENTS_PAGE_SIZE = 5;

type CommentItem = {
  _id: string;
  postID?: string;
  userID?: string;
  content: string;
  createdAt: string;
};

type PaginatedCommentsResponse = {
  data: CommentItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

const CommentsPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<null | Post>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, accessToken } = useAuth();
  const currentUserId = getUserIdFromToken(accessToken);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const isLiked = !!(post && currentUserId && post.likes.includes(currentUserId));

  const handleLike = async () => {
    if (!postId || !isAuthenticated) return;
    try {
      const resp = await apiClient.post<{ liked: boolean; likesCount: number; likes: string[] }>(
        `/posts/${postId}/like`,
        {}
      );
      setPost((prev) =>
        prev
          ? { ...prev, likes: resp.data.likes, likesCount: resp.data.likesCount }
          : prev
      );
    } catch {
      setError("Failed to like post");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!postId) return;
      setLoading(true);
      setError(null);
      try {
        const [postResp, commentsResp, usersResp] = await Promise.all([
          apiClient.get<Post>(`/posts/${postId}`),
          apiClient.get<PaginatedCommentsResponse>(`/comments/postID/${postId}?page=1&limit=${COMMENTS_PAGE_SIZE}`),
          apiClient.get<User[]>(`/users`),
        ]);
        setPost(postResp.data);
        setComments(commentsResp.data.data || []);
        setHasMore(commentsResp.data.hasMore);
        setPage(1);
        setUsers(usersResp.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load post, comments, or users");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [postId]);

  const loadMore = useCallback(async () => {
    if (!postId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const resp = await apiClient.get<PaginatedCommentsResponse>(
        `/comments/postID/${postId}?page=${nextPage}&limit=${COMMENTS_PAGE_SIZE}`
      );
      setComments((prev) => [...prev, ...resp.data.data]);
      setHasMore(resp.data.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
      setError("Failed to load more comments");
    } finally {
      setLoadingMore(false);
    }
  }, [postId, loadingMore, hasMore, page]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await apiClient.post<CommentItem>(
        `/comments`,
        { postID: postId, content: newComment.trim() },
      );

      const respData = resp.data as CommentItem;
      const added: CommentItem = respData.userID
        ? respData
        : {
            _id: respData._id || `temp-${Date.now()}`,
            content: respData.content,
            createdAt: respData.createdAt || new Date().toISOString(),
            postID: respData.postID,
          };

      setComments((prev) => [added, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      setError("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      await apiClient.put(`/comments/${commentId}`, { content });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, content } : c))
      );
      setEditingCommentId(null);
      setEditingContent("");
    } catch {
      setError("Failed to edit comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiClient.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setDeleteCommentId(null);
    } catch {
      setError("Failed to delete comment");
    }
  };

  const postUser = users.find((u) => u._id === post?.userID);

  return (
    <Box>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Comments
        </Typography>

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

        {!loading && comments.length === 0 && (
          <Alert severity="info">
            No comments yet — be the first to comment.
          </Alert>
        )}

        {!loading && (
          <Box sx={{ mt: 2 }}>
            {post && (
              <Card sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
                <CardHeader
                  avatar={
                    <Avatar src={postUser?.profileImage || ""}>
                      {postUser?.username?.charAt(0).toUpperCase() || "U"}
                    </Avatar>
                  }
                  title={postUser?.username || "User"}
                  subheader={new Date(post.createdAt).toLocaleString()}
                />
                {post.image && (
                  <CardMedia
                    component="img"
                    image={post.image}
                    alt="post image"
                  />
                )}
                <CardContent>
                  <Typography variant="body2">{post.content}</Typography>
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title={isLiked ? "Unlike" : "Like"}>
                      <IconButton
                        size="small"
                        onClick={handleLike}
                        disabled={!isAuthenticated}
                        sx={{
                          color: isLiked ? "#e53935" : "text.secondary",
                          transition: "color 0.2s",
                          p: 0.5,
                        }}
                      >
                        {isLiked ? (
                          <FavoriteIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <FavoriteBorderIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color={isLiked ? "#e53935" : "text.secondary"}
                    >
                      {post.likesCount}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            <List>
              {comments.map((c, idx) => {
                const user = users.find((u) => u._id === c.userID);
                const isCommentOwner = currentUserId != null && c.userID != null && currentUserId === c.userID.toString();
                return (
                  <React.Fragment key={c._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar src={user?.profileImage || ""}>
                          {user?.username?.charAt(0).toUpperCase() || "U"}
                        </Avatar>
                      </ListItemAvatar>

                      {editingCommentId === c._id ? (
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            fullWidth
                            multiline
                            minRows={1}
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            size="small"
                            autoFocus
                          />
                          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleEditComment(c._id, editingContent)}
                              disabled={!editingContent.trim()}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingContent("");
                              }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <ListItemText
                            primary={
                              <>
                                <Typography
                                  component="span"
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600, mr: 1 }}
                                >
                                  {user?.username || c.userID || "User"}
                                </Typography>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="textPrimary"
                                >
                                  {c.content}
                                </Typography>
                              </>
                            }
                            secondary={
                              <Typography
                                component="div"
                                variant="caption"
                                color="textSecondary"
                              >
                                {new Date(c.createdAt).toLocaleString()}
                              </Typography>
                            }
                          />
                          {isCommentOwner && (
                            <Box sx={{ display: "flex", alignItems: "flex-start", ml: 1 }}>
                              <Tooltip title="Edit comment">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingCommentId(c._id);
                                    setEditingContent(c.content);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete comment">
                                <IconButton
                                  size="small"
                                  onClick={() => setDeleteCommentId(c._id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </>
                      )}
                    </ListItem>
                    {idx < comments.length - 1 && (
                      <Divider variant="fullWidth" component="li" />
                    )}
                  </React.Fragment>
                );
              })}
            </List>

            {hasMore && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1, mb: 2 }}>
                <Button variant="outlined" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                  Load more comments
                </Button>
              </Box>
            )}

            {isAuthenticated && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!submitting && newComment.trim()) {
                    await handleAddComment();
                  }
                }}
                style={{ display: "flex", gap: 8, marginTop: 16 }}
              >
                <TextField
                  placeholder="Write a comment..."
                  fullWidth
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  multiline
                  minRows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.altKey && !e.shiftKey) {
                      e.preventDefault();
                      if (!submitting && newComment.trim()) {
                        handleAddComment();
                      }
                    } else if (e.key === "Enter" && (e.altKey || e.shiftKey)) {
                      // allow newline
                      const target = e.target as unknown as HTMLTextAreaElement;
                      const { selectionStart, selectionEnd, value } = target;
                      setNewComment(
                        value.substring(0, selectionStart || 0) +
                          "\n" +
                          value.substring(selectionEnd || 0),
                      );
                      e.preventDefault();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting || newComment.trim() === ""}
                  style={{
                    background: "none",
                    border: "none",
                    cursor:
                      submitting || newComment.trim() === ""
                        ? "not-allowed"
                        : "pointer",
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    color:
                      submitting || newComment.trim() === ""
                        ? "#ccc"
                        : "#8134af",
                    transition: "color 0.2s",
                  }}
                  aria-label="Send"
                  tabIndex={0}
                  onMouseOver={(e) => {
                    if (!(submitting || newComment.trim() === ""))
                      e.currentTarget.style.color = "#a259c1";
                  }}
                  onMouseOut={(e) => {
                    if (!(submitting || newComment.trim() === ""))
                      e.currentTarget.style.color = "#8134af";
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24"
                    width="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            )}
          </Box>
        )}

        {/* Delete Comment Confirmation Dialog */}
        <Dialog open={deleteCommentId !== null} onClose={() => setDeleteCommentId(null)}>
          <DialogTitle>Delete Comment</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteCommentId(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (deleteCommentId) handleDeleteComment(deleteCommentId);
              }}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CommentsPage;
