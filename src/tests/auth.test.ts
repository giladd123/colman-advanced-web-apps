import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
import initApp from "../app";
import { User } from "../models/user";

let app: Express;

beforeAll(async () => {
  app = await initApp();
  // Clean the users collection before running tests
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Auth Endpoints", () => {
  const testUser = {
    username: "testuser",
    email: "test@example.com",
    password: "testpassword123",
  };

  let accessToken: string;
  let refreshToken: string;

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app).post("/auth/register").send(testUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
    });

    it("should fail to register with an existing email", async () => {
      const response = await request(app).post("/auth/register").send(testUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Email already in use");
    });

    it("should fail with missing username", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ email: "new@example.com", password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or missing username");
    });

    it("should fail with missing email", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ username: "newuser", password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or missing email");
    });

    it("should fail with invalid email format", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          username: "newuser",
          email: "invalid-email",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or missing email");
    });

    it("should fail with missing password", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ username: "newuser", email: "new@example.com" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or missing password");
    });
  });

  describe("POST /auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: testUser.email, password: testUser.password });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it("should fail with incorrect password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: testUser.email, password: "wrongpassword" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid email or password");
    });

    it("should fail with non-existent email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "nonexistent@example.com", password: "password123" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid email or password");
    });

    it("should fail with missing email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or missing email");
    });

    it("should fail with missing password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: testUser.email });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid or missing password");
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh tokens successfully", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");

      // Update tokens for subsequent tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it("should fail with invalid refresh token", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid refresh token");
    });

    it("should fail with missing refresh token", async () => {
      const response = await request(app).post("/auth/refresh").send({});

      expect(response.status).toBe(400);
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout successfully", async () => {
      // First login to get a valid refresh token
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: testUser.email, password: testUser.password });

      const validRefreshToken = loginResponse.body.refreshToken;

      const response = await request(app)
        .post("/auth/logout")
        .send({ refreshToken: validRefreshToken });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out successfully");
    });

    it("should still return success with invalid refresh token (for security)", async () => {
      const response = await request(app)
        .post("/auth/logout")
        .send({ refreshToken: "invalid-token" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out successfully");
    });

    it("should fail with missing refresh token", async () => {
      const response = await request(app).post("/auth/logout").send({});

      expect(response.status).toBe(400);
    });
  });
});
