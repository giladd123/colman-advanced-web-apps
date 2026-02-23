import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useAuth } from "../context/useAuth";
import { apiClient } from "../services/api";

const NewPost: React.FC = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("image", selectedFile);

      await apiClient.post("/posts", formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/home");
    } catch {
      setError("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Container
        maxWidth="sm"
        sx={{
          py: 3,
          flex: 1,
          overflowY: "auto",
          maxHeight: "calc(100vh - 64px)",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          New Post
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          {/* Image Upload */}
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              width: "100%",
              height: 300,
              border: "2px dashed",
              borderColor: imagePreview ? "transparent" : "grey.400",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              mb: 3,
              "&:hover": {
                borderColor: imagePreview ? "transparent" : "#2563eb",
              },
            }}
          >
            {imagePreview ? (
              <Box
                component="img"
                src={imagePreview}
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
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            hidden
            onChange={handleFileSelect}
          />

          {/* Content */}
          <TextField
            label="Share your code snippet or question..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={4}
            fullWidth
            sx={{ mb: 3 }}
          />

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={() => navigate("/home")}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || !selectedFile || !content.trim()}
              sx={{
                bgcolor: "#2563eb",
                "&:hover": { bgcolor: "#1d4ed8" },
              }}
            >
              {submitting ? <CircularProgress size={20} /> : "Post"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default NewPost;
