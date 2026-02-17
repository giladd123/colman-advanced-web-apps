import type { User } from "./user";

export interface Post {
  _id: string;
  userID: string;
  content: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  likes: string[]; // Array of user IDs who liked the post
}

export interface PostCardProps {
  post: Post;
  isLiked: boolean;
  onLike: (postId: string) => void;
  user: User | undefined;
}

export interface PostListProps {
  posts: Post[];
  users: User[];
  likedPosts: Set<string>;
  onLike: (postId: string) => void;
}
