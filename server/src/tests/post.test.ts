import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
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

beforeAll(async () => {
  app = await initApp();
  // Clean collections before running tests
  await User.deleteMany({});
  await postModel.deleteMany({});

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
  await mongoose.connection.close();
});

describe("Post Endpoints", () => {
  let createdPostId: string;

  describe("POST /posts", () => {
    it("should create a new post when authenticated", async () => {
      const postData = {
        title: "Test Post Title",
        content: "This is the content of the test post",
      };

      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(postData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.title).toBe(postData.title);
      expect(response.body.content).toBe(postData.content);
      expect(response.body.userID).toBe(userId);

      createdPostId = response.body._id;
    });

    it("should fail to create post without authentication", async () => {
      const postData = {
        title: "Unauthorized Post",
        content: "This should not be created",
      };

      const response = await request(app).post("/api/posts").send(postData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should fail with invalid token", async () => {
      const postData = {
        title: "Invalid Token Post",
        content: "This should not be created",
      };

      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", "Bearer invalid-token")
        .send(postData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid token");
    });

    it("should fail with missing title", async () => {
      const postData = {
        content: "Content without title",
      };

      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(postData);

      expect(response.status).toBe(400);
    });

    it("should fail with missing content", async () => {
      const postData = {
        title: "Title without content",
      };

      const response = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(postData);

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
        title: "Updated Post Title",
        content: "Updated content",
      };

      const response = await request(app)
        .put(`/api/posts/${createdPostId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(createdPostId);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.content).toBe(updateData.content);
    });

    it("should update only the title", async () => {
      const updateData = {
        title: "Only Title Updated",
      };

      const response = await request(app)
        .put(`/api/posts/${createdPostId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(createdPostId);
      expect(response.body.title).toBe(updateData.title);
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
        title: "Unauthorized Update",
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
        title: "Update Non-existent Post",
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
        title: "Invalid ID Update",
      };

      const response = await request(app)
        .put("/api/posts/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
    });

    it("should fail when user tries to update another user's post", async () => {
      const updateData = {
        title: "Trying to update someone else's post",
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
});
