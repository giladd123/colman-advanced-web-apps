import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
import path from "path";
import fs from "fs";
import initApp from "../app";
import { User } from "../models/user";
import { postModel } from "../models/post";
import { commentModel } from "../models/comment";

let app: Express;
let accessToken: string;
let userId: string;
let postId: string;

const testImagePath = path.join(__dirname, "test-image-comment.png");

const testUser = {
  username: "commentuser",
  email: "commentuser@example.com",
  password: "testpassword123",
};

const secondUser = {
  username: "secondcommentuser",
  email: "secondcommentuser@example.com",
  password: "testpassword456",
};

let secondUserAccessToken: string;

beforeAll(async () => {
  app = await initApp();
  // Clean collections before running tests
  await User.deleteMany({});
  await postModel.deleteMany({});
  await commentModel.deleteMany({});

  // Create a minimal test image (1x1 PNG)
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  fs.writeFileSync(testImagePath, pngBuffer);

  // Register user
  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send(testUser);

  accessToken = registerResponse.body.accessToken;

  // Get user ID
  const user = await User.findOne({ email: testUser.email });
  userId = user!._id.toString();

  // Create a post to comment on
  const postResponse = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${accessToken}`)
    .attach("image", testImagePath)
    .field("content", "Post content for comments");

  postId = postResponse.body._id;

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

describe("Comment Endpoints", () => {
  let createdCommentId: string;

  describe("POST /comments", () => {
    it("should create a new comment when authenticated", async () => {
      const commentData = {
        postID: postId,
        content: "This is a test comment",
      };

      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.content).toBe(commentData.content);
      expect(response.body.postID).toBe(postId);

      createdCommentId = response.body._id;
    });

    it("should fail to create comment without authentication", async () => {
      const commentData = {
        postID: postId,
        content: "Unauthorized comment",
      };

      const response = await request(app)
        .post("/api/comments")
        .send(commentData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should fail with invalid token", async () => {
      const commentData = {
        postID: postId,
        content: "Invalid token comment",
      };

      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", "Bearer invalid-token")
        .send(commentData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid token");
    });

    it("should fail with missing postID", async () => {
      const commentData = {
        content: "Comment without post ID",
      };

      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(commentData);

      expect(response.status).toBe(400);
    });

    it("should fail with missing content", async () => {
      const commentData = {
        postID: postId,
      };

      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(commentData);

      expect(response.status).toBe(400);
    });

    it("should fail with invalid postID format", async () => {
      const commentData = {
        postID: "invalid-post-id",
        content: "Comment with invalid post ID",
      };

      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(commentData);

      expect(response.status).toBe(400);
    });

    it("should allow a user to comment on another user's post", async () => {
      const commentData = {
        postID: postId, // This post belongs to testUser
        content: "Comment from another user on your post",
      };

      // secondUser comments on testUser's post
      const response = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${secondUserAccessToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.content).toBe(commentData.content);
      expect(response.body.postID).toBe(postId);
    });
  });

  describe("GET /comments/postID/:postID", () => {
    it("should get all comments for a post", async () => {
      const response = await request(app).get(`/api/comments/postID/${postId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].postID).toBe(postId);
    });

    it("should return empty array for post with no comments", async () => {
      // Create a new post without comments
      const newPostResponse = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("image", testImagePath)
        .field("content", "No comments here");

      const newPostId = newPostResponse.body._id;

      const response = await request(app).get(
        `/api/comments/postID/${newPostId}`,
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it("should return 404 for non-existent post ID", async () => {
      const fakePostId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(
        `/api/comments/postID/${fakePostId}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe(`Post ${fakePostId} not found`);
    });

    it("should fail with invalid post ID format", async () => {
      const response = await request(app).get(
        "/api/comments/postID/invalid-id",
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid postID: invalid-id");
    });
  });

  describe("GET /comments/commentID/:id", () => {
    it("should get a specific comment by ID", async () => {
      const response = await request(app).get(
        `/api/comments/commentID/${createdCommentId}`,
      );

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(createdCommentId);
      expect(response.body.content).toBe("This is a test comment");
    });

    it("should return 404 for non-existent comment ID", async () => {
      const fakeCommentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(
        `/api/comments/commentID/${fakeCommentId}`,
      );

      expect(response.status).toBe(404);
    });

    it("should fail with invalid comment ID format", async () => {
      const response = await request(app).get(
        "/api/comments/commentID/invalid-id",
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid comment id: invalid-id");
    });
  });

  describe("PUT /comments/:id", () => {
    it("should update a comment when authenticated", async () => {
      const updateData = {
        content: "Updated comment content",
      };

      const response = await request(app)
        .put(`/api/comments/${createdCommentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.content).toBe(updateData.content);
    });

    it("should fail to update without authentication", async () => {
      const updateData = {
        content: "Unauthorized update",
      };

      const response = await request(app)
        .put(`/api/comments/${createdCommentId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should fail with missing content", async () => {
      const response = await request(app)
        .put(`/api/comments/${createdCommentId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should fail with invalid comment ID format", async () => {
      const updateData = {
        content: "Invalid ID update",
      };

      const response = await request(app)
        .put("/api/comments/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
    });

    it("should fail when user tries to update another user's comment", async () => {
      // First create a new comment to test with (since the original might be deleted)
      const commentData = {
        postID: postId,
        content: "Comment for authorization test",
      };

      const createResponse = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(commentData);

      const commentId = createResponse.body._id;

      const updateData = {
        content: "Trying to update someone else's comment",
      };

      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${secondUserAccessToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "The user is not allowed to modify this comment",
      );
    });
  });

  describe("DELETE /comments/:id", () => {
    it("should fail to delete without authentication", async () => {
      const response = await request(app).delete(
        `/api/comments/${createdCommentId}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should fail with invalid comment ID format", async () => {
      const response = await request(app)
        .delete("/api/comments/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it("should fail when user tries to delete another user's comment", async () => {
      // First create a comment by first user
      const commentData = {
        postID: postId,
        content: "Comment for delete authorization test",
      };

      const createResponse = await request(app)
        .post("/api/comments")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(commentData);

      const commentId = createResponse.body._id;

      // Try to delete with second user's token
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${secondUserAccessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "The user is not allowed to modify this comment",
      );
    });

    it("should delete a comment when authenticated", async () => {
      const response = await request(app)
        .delete(`/api/comments/${createdCommentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        `The comment ${createdCommentId} deleted successfully`,
      );
    });

    it("should return 404 when deleting non-existent comment", async () => {
      const fakeCommentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .delete(`/api/comments/${fakeCommentId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });
});
