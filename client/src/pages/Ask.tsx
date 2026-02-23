import React, { useState } from "react";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
} from "@mui/material";
import { apiClient } from "../services/api";
import { useNavigate } from "react-router-dom";

interface Source {
  content: string;
  sourceType: string;
  score: number;
  postId: string;
}

const Ask: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);

    try {
      const res = await apiClient.post("/rag/query", { question });
      setAnswer(res.data.answer);
      setSources(res.data.sources || []);
    } catch {
      setError("Failed to get an answer. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Ask about the forum
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Ask a question about posts and discussions..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleAsk}
            disabled={loading || !question.trim()}
          >
            Ask
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {answer && (
          <Paper sx={{ p: 2, whiteSpace: "pre-wrap", mb: 2 }}>
            <Typography>{answer}</Typography>
          </Paper>
        )}

        {sources.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Sources
            </Typography>
            {sources.map((source, i) => (
              <Paper
                key={i}
                sx={{
                  p: 1.5,
                  mb: 1,
                  cursor: source.postId ? "pointer" : "default",
                }}
                variant="outlined"
                onClick={() =>
                  source.postId && navigate(`/posts/${source.postId}/comments`)
                }
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Chip
                    label={source.sourceType}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(source.score * 100)}% match
                  </Typography>
                </Box>
                <Typography variant="body2">{source.content}</Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Ask;
