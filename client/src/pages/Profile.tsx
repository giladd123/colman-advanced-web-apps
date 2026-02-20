import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Avatar,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PostList from "../components/PostList";
import type { User } from "../types/user";
import { useAuth } from "../context/useAuth";
import { getUserIdFromToken } from "../utils/usersUtil";
import { apiClient } from "../services/api";
import { usePosts } from "../hooks/usePosts";

const Profile: React.FC = () => {
  const { accessToken, logout } = useAuth();
  const userId = getUserIdFromToken(accessToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate("/auth");
    }
  }, [userId, navigate]);

  // used to satisfy the function signature as it doesn't accept nulls.
  // UseEffect happens after render so it might mean there's no userId,
  // we still want the fetch to happen.
  const { posts, users, likedPosts, loading, error, handleLike, handleEditPost, handleDeletePost, setUsers } =
    usePosts(userId ?? undefined);

  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setUserLoading(true);
      setUserError(null);
      try {
        const resp = await apiClient.get<User>(`/users/${userId}`);
        setUser(resp.data);
        setEditUsername(resp.data.username);
      } catch {
        setUserError("Failed to load user data");
      } finally {
        setUserLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setUserError(null);
    try {
      const formData = new FormData();
      if (editUsername !== user?.username) {
        formData.append("username", editUsername);
      }
      if (selectedFile) {
        formData.append("profileImage", selectedFile);
      }

      const resp = await apiClient.put<User>(`/users/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(resp.data);
      setUsers((prev) => prev.map((u) => (u._id === userId ? resp.data : u)));
      setEditing(false);
      setSelectedFile(null);
      setImagePreview(null);
      window.dispatchEvent(new Event("profile-updated"));
    } catch {
      setUserError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditUsername(user?.username || "");
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (loading || userLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const displayError = userError || error;

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
        {displayError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {displayError}
          </Alert>
        )}

        {/* Profile Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            {/* Avatar */}
            <Box sx={{ position: "relative" }}>
              <Avatar
                alt={user?.username}
                src={imagePreview || user?.profileImage || ""}
                sx={{ width: 100, height: 100, fontSize: 40 }}
              >
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </Avatar>
              {editing && (
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "#8134af",
                    color: "#fff",
                    "&:hover": { bgcolor: "#6a2b91" },
                  }}
                >
                  <CameraAltIcon fontSize="small" />
                </IconButton>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                hidden
                onChange={handleFileSelect}
              />
            </Box>

            {/* User Info */}
            <Box sx={{ flex: 1, minWidth: 200 }}>
              {editing ? (
                <TextField
                  label="Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ mb: 1 }}
                />
              ) : (
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {user?.username}
                </Typography>
              )}
              <Typography variant="body2" color="textSecondary">
                {user?.email}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mt: 0.5 }}
              >
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              {editing ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      bgcolor: "#8134af",
                      "&:hover": { bgcolor: "#6a2b91" },
                    }}
                  >
                    {saving ? <CircularProgress size={20} /> : "Save"}
                  </Button>
                  <Button variant="outlined" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setEditing(true)}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Paper>

        {/* User's Posts */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Posts
        </Typography>
        {posts.length === 0 ? (
          <Typography color="textSecondary">No posts yet.</Typography>
        ) : (
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

export default Profile;
