import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import type { User } from "../types/user";
import type { Post } from "../types/post";
import { useAuth } from "../context/useAuth";
import { apiClient } from "../services/api";

type CommentItem = {
  _id: string;
  postID?: string;
  userID?: string;
  content: string;
  createdAt: string;
};

const CommentsPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<null | Post>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!postId) return;
      setLoading(true);
      setError(null);
      try {
        const [postsResp, commentsResp, usersResp] = await Promise.all([
          apiClient.get<Post[]>(`/posts`),
          apiClient.get<CommentItem[]>(`/comments/postID/${postId}`),
          apiClient.get<User[]>(`/users`),
        ]);
        const found = postsResp.data.find((p) => p._id === postId);
        if (found) setPost(found);
        setComments(commentsResp.data || []);
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
                </CardContent>
              </Card>
            )}

            <List>
              {comments.map((c, idx) => {
                const user = users.find((u) => u._id === c.userID);
                return (
                  <React.Fragment key={c._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar src={user?.profileImage || ""}>
                          {user?.username?.charAt(0).toUpperCase() || "U"}
                        </Avatar>
                      </ListItemAvatar>
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
                    </ListItem>
                    {idx < comments.length - 1 && (
                      <Divider variant="fullWidth" component="li" />
                    )}
                  </React.Fragment>
                );
              })}
            </List>

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
      </Container>
    </Box>
  );
};

export default CommentsPage;
