import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { authService } from "../services/authService";
import { useAuth } from "../context/useAuth";

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isAuthenticated, validateAndRefreshToken } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const checkExistingAuth = async () => {
      const isValid = await validateAndRefreshToken();
      if (isValid) {
        navigate("/home");
      }
    };
    checkExistingAuth();
  }, [isAuthenticated, validateAndRefreshToken, navigate]);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = (): boolean => {
    if (!formData.email || !validateEmail(formData.email)) {
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      return false;
    }
    if (!isLogin && !formData.username) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isFormValid()) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (isLogin) {
        response = await authService.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        response = await authService.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
      }

      login(response.accessToken, response.refreshToken);
      navigate("/home");
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      const errorMessage = error.response?.data?.error || "Authentication failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({
      username: "",
      email: "",
      password: "",
    });
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          py: 2,
        }}
      >
        <Paper elevation={3} sx={{ padding: 2.5, width: "100%" }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#fff",
                fontSize: 20,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                mb: 1,
              }}
            >
              {"</>"}
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                letterSpacing: 1,
              }}
            >
              Codely
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              A community for developers
            </Typography>
          </Box>
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            align="center"
            sx={{ mb: 2, fontWeight: 600 }}
          >
            {isLogin ? "Login" : "Sign Up"}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
          >
            {!isLogin && (
              <TextField
                label="Username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                fullWidth
                placeholder="Choose a username"
                required
              />
            )}

            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              placeholder="your@email.com"
              required
            />

            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              placeholder="At least 6 characters"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="medium"
              disabled={loading || !isFormValid()}
              sx={{ mt: 0.5 }}
            >
              {loading ? <CircularProgress size={24} /> : isLogin ? "Login" : "Sign Up"}
            </Button>
          </Box>

          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Divider sx={{ width: "100%" }}>or</Divider>
            <GoogleLogin
              onSuccess={async (credentialResponse: CredentialResponse) => {
                if (!credentialResponse.credential) {
                  setError("Google sign-in failed: no credential received");
                  return;
                }
                setLoading(true);
                setError(null);
                try {
                  const response = await authService.googleSignIn(credentialResponse.credential);
                  login(response.accessToken, response.refreshToken);
                  navigate("/home");
                } catch (err) {
                  const error = err as AxiosError<{ error: string }>;
                  setError(error.response?.data?.error || "Google sign-in failed");
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => {
                setError("Google sign-in failed");
              }}
              width="360"
            />
          </Box>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2" color="textSecondary">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Button
                onClick={toggleMode}
                sx={{
                  textTransform: "none",
                  p: 0,
                  ml: 0.5,
                  fontSize: "inherit",
                  fontWeight: 600,
                }}
                color="primary"
              >
                {isLogin ? "Sign Up" : "Login"}
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Auth;
