import mongoose from "mongoose";
import { User } from "./src/models/user";
import { postModel } from "./src/models/post";
import { commentModel } from "./src/models/comment";
import { embeddingModel } from "./src/models/embedding";
import { askLLM } from "./src/services/llmService";
import { indexContent } from "./src/controllers/ragController";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

// ─── User Profiles ───────────────────────────────────────────────────────────

const USER_PROFILES = [
  {
    username: "alice_dev",
    email: "alice@codely.dev",
    avatarImg: 1,
    persona: "a senior full-stack developer who loves TypeScript",
  },
  {
    username: "bob_codes",
    email: "bob@codely.dev",
    avatarImg: 5,
    persona: "a backend engineer specialising in Node.js and databases",
  },
  {
    username: "charlie_tech",
    email: "charlie@codely.dev",
    avatarImg: 12,
    persona: "a DevOps engineer who cares a lot about CI/CD and containers",
  },
  {
    username: "diana_js",
    email: "diana@codely.dev",
    avatarImg: 47,
    persona: "a frontend specialist obsessed with React and UX performance",
  },
  {
    username: "ethan_leads",
    email: "ethan@codely.dev",
    avatarImg: 33,
    persona:
      "a tech lead who thinks deeply about architecture and code quality",
  },
  {
    username: "fiona_dev",
    email: "fiona@codely.dev",
    avatarImg: 60,
    persona: "a junior developer who asks great questions and learns quickly",
  },
];

// ─── Post Topics ─────────────────────────────────────────────────────────────

const POST_TOPICS = [
  "A useful TypeScript utility type or generic trick you recently discovered",
  "A MongoDB aggregation pipeline pattern that solved a real problem for you",
  "A React performance optimisation (memoization, lazy loading, or profiling)",
  "Node.js error handling best practices you wish you had known earlier",
  "A CSS layout technique (Grid, Container Queries, or logical properties)",
  "A Git workflow or alias that meaningfully improved your daily productivity",
  "A REST API design decision — versioning, error shapes, or pagination style",
  "A testing strategy or tool that genuinely improved your code quality",
  "A Docker or Kubernetes tip for faster local development or leaner images",
  "An algorithm or data structure you recently implemented and would recommend",
];

// ─── Stock images (picsum.photos) ────────────────────────────────────────────

const POST_IMAGES = [
  "https://picsum.photos/seed/typescript/600/400",
  "https://picsum.photos/seed/mongodb/600/400",
  "https://picsum.photos/seed/react/600/400",
  "https://picsum.photos/seed/nodejs/600/400",
  "https://picsum.photos/seed/css/600/400",
  "https://picsum.photos/seed/git/600/400",
  "https://picsum.photos/seed/api/600/400",
  "https://picsum.photos/seed/testing/600/400",
  "https://picsum.photos/seed/docker/600/400",
  "https://picsum.photos/seed/algorithms/600/400",
];

// ─── LLM helpers ─────────────────────────────────────────────────────────────

async function generatePostContent(topic: string): Promise<string> {
  const prompt = `You are a developer writing a short post on "Codely", a coding forum.
Write a 2-4 sentence forum post about the following topic: "${topic}".
Make it sound natural, practical, and slightly informal — like a real developer sharing with peers.
Include a specific example, command, or short code hint where relevant. Keep it under 200 words.
Return only the post text — no title, no markdown headings.`;
  return askLLM(prompt);
}

async function generateComment(
  postContent: string,
  commenterPersona: string,
): Promise<string> {
  const prompt = `You are ${commenterPersona} writing a comment on a coding forum called "Codely".
The post you are replying to says:
"${postContent}"

Write a single comment (1-3 sentences) that genuinely engages with the post.
It can be a follow-up question, a related tip, friendly agreement, or mild pushback.
Sound like a real developer. Keep it under 80 words.
Return only the comment text.`;
  return askLLM(prompt);
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Connecting to database…");
  await mongoose.connect(process.env.DATABASE_URL!);

  console.log("Clearing existing data…");
  await User.deleteMany({});
  await postModel.deleteMany({});
  await commentModel.deleteMany({});
  await embeddingModel.deleteMany({});

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log("Creating users…");
  const users = await Promise.all(
    USER_PROFILES.map(({ username, email, avatarImg }) =>
      new User({
        username,
        email,
        password: "qwe123",
        profileImage: `https://i.pravatar.cc/150?img=${avatarImg}`,
      }).save(),
    ),
  );
  console.log(`  ✓ ${users.length} users created`);

  // ── Posts ──────────────────────────────────────────────────────────────────
  console.log("Generating posts via LLM…");
  const posts = [];
  for (let i = 0; i < POST_TOPICS.length; i++) {
    const authorIndex = i % users.length;
    console.log(
      `  Post ${i + 1}/${POST_TOPICS.length} (author: ${users[authorIndex].username})`,
    );
    const content = await generatePostContent(POST_TOPICS[i]);
    const post = await postModel.create({
      userID: users[authorIndex]._id,
      content,
      image: POST_IMAGES[i],
      likesCount: 0,
      commentsCount: 0,
    });
    posts.push(post);
  }
  console.log(`  ✓ ${posts.length} posts created`);

  // ── Comments ───────────────────────────────────────────────────────────────
  console.log("Generating comments via LLM…");
  const comments = [];
  for (let i = 0; i < posts.length; i++) {
    // 2–3 comments per post, from different users than the author
    const commentCount = 2 + (i % 2); // alternates 2 / 3
    for (let j = 0; j < commentCount; j++) {
      // Pick a commenter that is not the post author
      const authorIndex = i % users.length;
      const commenterIndex = (authorIndex + j + 1) % users.length;
      const persona = USER_PROFILES[commenterIndex].persona;
      console.log(
        `  Comment ${j + 1}/${commentCount} on post ${i + 1} (commenter: ${users[commenterIndex].username})`,
      );
      const content = await generateComment(posts[i].content, persona);
      const comment = await commentModel.create({
        postID: posts[i]._id,
        userID: users[commenterIndex]._id,
        content,
      });
      comments.push(comment);
    }
  }
  console.log(`  ✓ ${comments.length} comments created`);

  // ── Likes ──────────────────────────────────────────────────────────────────
  console.log("Creating likes…");
  const postLikesMap = new Map<string, mongoose.Types.ObjectId[]>();

  for (let i = 0; i < posts.length; i++) {
    const likeCount = 1 + (i % 3); // 1, 2, or 3 likes per post
    const likers = new Set<string>();
    const likerIds: mongoose.Types.ObjectId[] = [];
    for (let j = 0; j < likeCount; j++) {
      const likerIndex = (i + j + 2) % users.length;
      const uid = users[likerIndex]._id.toString();
      if (likers.has(uid)) continue;
      likers.add(uid);
      likerIds.push(users[likerIndex]._id as mongoose.Types.ObjectId);
    }
    postLikesMap.set(posts[i]._id.toString(), likerIds);
  }
  const totalLikes = [...postLikesMap.values()].reduce(
    (sum, ids) => sum + ids.length,
    0,
  );
  console.log(`  ✓ ${totalLikes} likes created`);

  // ── Update denormalised counts ─────────────────────────────────────────────
  console.log("Updating post counts…");
  for (const post of posts) {
    const commentsCount = await commentModel.countDocuments({
      postID: post._id,
    });
    const likers = postLikesMap.get(post._id.toString()) ?? [];
    await postModel.findByIdAndUpdate(post._id, {
      commentsCount,
      likes: likers,
      likesCount: likers.length,
    });
  }

  // ── RAG embeddings ─────────────────────────────────────────────────────────
  console.log("Indexing content for RAG (creating embeddings)…");
  const { indexed, total } = await indexContent();
  console.log(`  ✓ ${indexed}/${total} items indexed for semantic search`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\nSeed complete!");
  console.log(`  Users:      ${users.length}`);
  console.log(`  Posts:      ${posts.length}`);
  console.log(`  Comments:   ${comments.length}`);
  console.log(`  Likes:      ${totalLikes}`);
  console.log(`  Embeddings: ${indexed}`);
  console.log("\nAll users have password: qwe123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
