import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
import initApp from "../app";
import { User } from "../models/user";

let app: Express;
let accessToken: string;
let userId: string;

const testUser = {
  username: "usertest",
  email: "usertest@example.com",
  password: "testpassword123",
};

const secondUser = {
  username: "seconduser",
  email: "second@example.com",
  password: "secondpassword123",
};

beforeAll(async () => {
  app = await initApp();
  // Clean users collection before running tests
  await User.deleteMany({});

  // Register the main test user
  const registerResponse = await request(app)
    .post("/auth/register")
    .send(testUser);

  accessToken = registerResponse.body.accessToken;

  // Get user ID
  const user = await User.findOne({ email: testUser.email });
  userId = user!._id.toString();

  // Register a second user for some tests
  await request(app).post("/auth/register").send(secondUser);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("User Endpoints", () => {
  describe("GET /users", () => {
    it("should get all users when authenticated", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // Verify sensitive data is not included
      response.body.forEach((user: any) => {
        expect(user).not.toHaveProperty("password");
        expect(user).not.toHaveProperty("refreshTokens");
      });
    });

    it("should fail without authentication", async () => {
      const response = await request(app).get("/users");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should fail with invalid token", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid token");
    });
  });

  describe("GET /users/:id", () => {
    it("should get a specific user by ID when authenticated", async () => {
      const response = await request(app)
        .get(`/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(userId);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.username).toBe(testUser.username);

      // Verify sensitive data is not included
      expect(response.body).not.toHaveProperty("password");
      expect(response.body).not.toHaveProperty("refreshTokens");
    });

    it("should fail without authentication", async () => {
      const response = await request(app).get(`/users/${userId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/users/${fakeUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe(`The user ${fakeUserId} does not exist`);
    });

    it("should fail with invalid user ID format", async () => {
      const response = await request(app)
        .get("/users/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid user id: invalid-id");
    });
  });

  describe("PUT /users/:id", () => {
    it("should update user's own username", async () => {
      const updateData = {
        username: "updatedusername",
      };

      const response = await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(updateData.username);
      expect(response.body).not.toHaveProperty("password");
      expect(response.body).not.toHaveProperty("refreshTokens");
    });

    it("should update user's own email", async () => {
      const updateData = {
        email: "newemail@example.com",
      };

      const response = await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(updateData.email);

      // Revert email for subsequent tests
      await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ email: testUser.email });
    });

    it("should fail to update without authentication", async () => {
      const updateData = {
        username: "unauthorized",
      };

      const response = await request(app)
        .put(`/users/${userId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should fail to update another user's account", async () => {
      // Get second user's ID
      const secondUserDoc = await User.findOne({ email: secondUser.email });
      const secondUserId = secondUserDoc!._id.toString();

      const updateData = {
        username: "hackedusername",
      };

      const response = await request(app)
        .put(`/users/${secondUserId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("You can only update your own account");
    });

    it("should fail with invalid email format", async () => {
      const updateData = {
        email: "invalid-email",
      };

      const response = await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid email format");
    });

    it("should fail when email already exists", async () => {
      const updateData = {
        email: secondUser.email,
      };

      const response = await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Email already exists");
    });

    it("should fail with invalid user ID format", async () => {
      const updateData = {
        username: "invalidid",
      };

      const response = await request(app)
        .put("/users/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid user id: invalid-id");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        username: "nonexistent",
      };

      const response = await request(app)
        .put(`/users/${fakeUserId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe(`The user ${fakeUserId} does not exist`);
    });
  });

  describe("DELETE /users/:id", () => {
    it("should fail to delete without authentication", async () => {
      const response = await request(app).delete(`/users/${userId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Unauthorized");
    });

    it("should fail to delete another user's account", async () => {
      // Get second user's ID
      const secondUserDoc = await User.findOne({ email: secondUser.email });
      const secondUserId = secondUserDoc!._id.toString();

      const response = await request(app)
        .delete(`/users/${secondUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("You can only delete your own account");
    });

    it("should fail with invalid user ID format", async () => {
      const response = await request(app)
        .delete("/users/invalid-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid user id: invalid-id");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .delete(`/users/${fakeUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe(`The user ${fakeUserId} does not exist`);
    });

    it("should delete user's own account when authenticated", async () => {
      // Create a new user to delete
      const userToDelete = {
        username: "deleteme",
        email: "deleteme@example.com",
        password: "deletepassword",
      };

      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userToDelete);

      const deleteToken = registerResponse.body.accessToken;
      const userDoc = await User.findOne({ email: userToDelete.email });
      const deleteUserId = userDoc!._id.toString();

      const response = await request(app)
        .delete(`/users/${deleteUserId}`)
        .set("Authorization", `Bearer ${deleteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        `The user ${deleteUserId} deleted successfully`,
      );

      // Verify user is deleted
      const deletedUser = await User.findById(deleteUserId);
      expect(deletedUser).toBeNull();
    });
  });
});
