export interface User {
  id: number;
  email: string;
  handle: string;
  bio: string;
  favorite_snack: string;
  karma: number;
  is_admin: boolean;
  created_at: string;
}

export interface Confession {
  id: number;
  content: string;
  mood?: string;
  location?: string;
  tagged_users?: string;
  image_url?: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_handle: string;
}

export interface Comment {
  id: number;
  confession_id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_handle: string;
}

export interface Flag {
  id: number;
  content_type: 'confession' | 'comment';
  content_id: number;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  flagged_by: string;
  content_text?: string;
  content_user_id?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  handle: string;
  bio?: string;
  favorite_snack?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CreateConfessionData {
  content: string;
  mood?: string;
  location?: string;
  tagged_users?: string;
  image?: File;
}

export interface VoteData {
  vote_type: 'upvote' | 'downvote';
}

export interface FlagData {
  content_type: 'confession' | 'comment';
  content_id: number;
  reason: string;
}

export interface UserStats {
  total_confessions: number;
  total_comments: number;
  total_votes: number;
  total_flags: number;
  total_confession_upvotes: number;
  total_confession_downvotes: number;
  total_comment_upvotes: number;
  total_comment_downvotes: number;
  total_confession_votes: number;
  total_comment_votes: number;
  average_confession_upvotes: number;
  average_comment_upvotes: number;
}

export interface ModerationStats {
  total_flags: number;
  pending_flags: number;
  resolved_flags: number;
  dismissed_flags: number;
  confession_flags: number;
  comment_flags: number;
} 