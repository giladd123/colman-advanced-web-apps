import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Avatar,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import { useAuth } from "../context/useAuth";
import { getUserIdFromToken } from "../utils/usersUtil";
import type { User } from "../types/user";
import { apiClient } from "../services/api";

const Navbar: React.FC = () => {
  const { accessToken } = useAuth();
  const userId = getUserIdFromToken(accessToken);
  const navigate = useNavigate();
  const [username, setUsername] = React.useState<string>("User");
  const [profileImage, setProfileImage] = React.useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const user = await apiClient
        .get<User>(`/users/${userId}`)
        .then((res) => res.data);
      const username = user?.username || "User";
      const profileImage = user?.profileImage || "";
      setUsername(username);
      setProfileImage(profileImage);
    };
    fetchData();

    const handleProfileUpdated = () => fetchData();
    window.addEventListener("profile-updated", handleProfileUpdated);
    return () =>
      window.removeEventListener("profile-updated", handleProfileUpdated);
  }, [userId]);

  const handleLogoClick = () => {
    navigate("/home");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleNewPostClick = () => {
    navigate("/new-post");
  };

  const handleAskClick = () => {
    navigate("/ask");
  };

  return (
    <AppBar position="static" sx={{ boxShadow: 1, bgcolor: "#1e293b" }}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Brand: Codely + Logo */}
        <Box
          onClick={handleLogoClick}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            transition: "opacity 0.3s ease",
            "&:hover": {
              opacity: 0.8,
            },
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 1,
              boxShadow: 1,
              fontWeight: 700,
              color: "#fff",
              fontSize: 16,
              fontFamily: "'Fira Code', 'Courier New', monospace",
            }}
          >
            {"</>"}
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              letterSpacing: 1.2,
              fontFamily: "'Fira Code', 'Courier New', monospace",
              color: "#fff",
              fontSize: { xs: 18, sm: 22 },
            }}
          >
            Codely
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={handleNewPostClick}
            sx={{
              color: "#fff",
              transition: "opacity 0.3s ease",
              "&:hover": { opacity: 0.8 },
            }}
          >
            <AddCircleOutlineIcon />
          </IconButton>
          <IconButton
            onClick={handleAskClick}
            sx={{
              color: "#fff",
              transition: "opacity 0.3s ease",
              "&:hover": { opacity: 0.8 },
            }}
          >
            <QuestionAnswerIcon />
          </IconButton>
        </Box>

        {/* User Profile */}
        <Box
          onClick={handleProfileClick}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            transition: "opacity 0.3s ease",
            "&:hover": {
              opacity: 0.8,
            },
            p: 0.5,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              maxWidth: 150,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "#fff",
            }}
          >
            {username}
          </Typography>
          {profileImage ? (
            <Avatar
              alt={username}
              src={profileImage}
              sx={{ width: 40, height: 40, color: "rgba(255,255,255, 1)" }}
            />
          ) : (
            <Avatar
              alt={username}
              sx={{ width: 40, height: 40, bgcolor: "rgba(255,255,255,0.25)" }}
            >
              {username?.charAt(0).toUpperCase() || "U"}
            </Avatar>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
