import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
import path from "path";
import fs from "fs";
import initApp from "../app";
import { User } from "../models/user";
import { postModel } from "../models/post";

let app: Express;
let accessToken: string;
let userId: string;

const testUser = {
  username: "postuser",
  email: "postuser@example.com",
  password: "testpassword123",
};

const secondUser = {
  username: "secondpostuser",
  email: "secondpostuser@example.com",
  password: "testpassword456",
};

let secondUserAccessToken: string;

const testImagePath = path.join(__dirname, "test-image.png");

beforeAll(async () => {
  app = await initApp();
  // Clean collections before running tests
  await User.deleteMany({});
  await postModel.deleteMany({});

  // Create a minimal test image (1x1 PNG)
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  fs.writeFileSync(testImagePath, pngBuffer);

  // Register and login to get access token
  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send(testUser);

  accessToken = registerResponse.body.accessToken;

  // Get user ID from token (login again to make sure)
  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ email: testUser.email, password: testUser.password });

  accessToken = loginResponse.body.accessToken;

  // Get user to extract ID
  const user = await User.findOne({ email: testUser.email });
  userId = user!._id.toString();

  // Register second user for authorization tests
  const secondRegisterResponse = await request(app)
    .post("/api/auth/register")
    .send(secondUser);

  secondUserAccessToken = secondRegisterResponse.body.accessToken;
});

afterAll(async () => {
  if (fs.existsSync(testImagePath)) {
    fs.unlinkSync(testImagePath);
  }
  await mongoose.connection.close();
});

describe("Post Endpoints", () => {
  let createdPostId: string;

  describe("POST /posts", () => {
    it("should create a new post when authenticated", async () => {
      const content = "This is the content of the test post";
      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("image", testImagePath)
        .field("content", content);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.content).toBe(content);
      expect(response.body.userID).toBe(userId);
      expect(response.body.image).toMatch(/^\/uploads\/.+\.png$/);

      createdPostId = response.body._id;
    });

    it("should fail to create post without authentication", async () => {
      const response = await request(app)
        .post("/api/posts")
        .send({ content: "This should not be created" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should fail with invalid token", async () => {
      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", "Bearer invalid-token")
        .send({ content: "This should not be created" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid token");
    });

    it("should fail with missing image", async () => {
      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("content", "Content without image");

      expect(response.status).toBe(400);
    });

    it("should fail with missing content", async () => {
      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("image", testImagePath);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /posts", () => {
    it("should get all posts", async () => {
      const response = await request(app).get("/api/posts");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it("should get posts by user ID", async () => {
      const response = await request(app).get(`/api/posts?userID=${userId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].userID).toBe(userId);
    });

    it("should return empty array for non-existent user ID", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/posts?userID=${fakeUserId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe("PUT /posts/:postId", () => {
    it("should update a post when authenticated", async () => {
      const updateData = {
        content: "Updated content",
      };

      const response = await request(app)
        .put(`/api/posts/${createdPostId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(createdPostId);
      expect(response.body.content).toBe(updateData.content);
    });

    it("should update only the content", async () => {
      const updateData = {
        content: "Only content updated",
      };

      const response = await request(app)
        .put(`/api/posts/${createdPostId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(createdPostId);
      expect(response.body.content).toBe(updateData.content);
    });

    it("should fail to update without authentication", async () => {
      const updateData = {
        content: "Unauthorized Update",
      };

      const response = await request(app)
        .put(`/api/posts/${createdPostId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should return 404 for non-existent post", async () => {
      const fakePostId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        content: "Update Non-existent Post",
      };

      const response = await request(app)
        .put(`/api/posts/${fakePostId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Post not found");
    });

    it("should fail with invalid post ID format", async () => {
      const updateData = {
        content: "Invalid ID Update",
      };

      const response = await request(app)
        .put("/api/posts/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
    });

    it("should fail when user tries to update another user's post", async () => {
      const updateData = {
        content: "Trying to update someone else's post",
      };

      const response = await request(app)
        .put(`/api/posts/${createdPostId}`)
        .set("Authorization", `Bearer ${secondUserAccessToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "The user is not allowed to modify this post",
      );
    });
  });

  describe("DELETE /posts/:postId", () => {
    it("should fail to delete without authentication", async () => {
      const response = await request(app).delete(
        `/api/posts/${createdPostId}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should fail when user tries to delete another user's post", async () => {
      const response = await request(app)
        .delete(`/api/posts/${createdPostId}`)
        .set("Authorization", `Bearer ${secondUserAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "The user is not allowed to delete this post",
      );
    });

    it("should return 404 for non-existent post", async () => {
      const fakePostId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .delete(`/api/posts/${fakePostId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Post not found");
    });

    it("should fail with invalid post ID format", async () => {
      const response = await request(app)
        .delete("/api/posts/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should delete a post when authenticated as owner", async () => {
      const response = await request(app)
        .delete(`/api/posts/${createdPostId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("deleted successfully");

      // Verify the post is actually deleted
      const getResponse = await request(app).get("/api/posts");
      const postIds = getResponse.body.map((p: any) => p._id);
      expect(postIds).not.toContain(createdPostId);
    });
  });

  describe("POST /posts/:postId/like", () => {
    let likeTestPostId: string;

    beforeAll(async () => {
      // Create a post to test likes on
      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("image", testImagePath)
        .field("content", "Post for like testing");

      likeTestPostId = response.body._id;
    });

    it("should like a post when authenticated", async () => {
      const response = await request(app)
        .post(`/api/posts/${likeTestPostId}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(true);
      expect(response.body.likesCount).toBe(1);
    });

    it("should unlike a post when toggled again", async () => {
      const response = await request(app)
        .post(`/api/posts/${likeTestPostId}/like`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(false);
      expect(response.body.likesCount).toBe(0);
    });

    it("should fail to like without authentication", async () => {
      const response = await request(app).post(
        `/api/posts/${likeTestPostId}/like`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });
  });
});
