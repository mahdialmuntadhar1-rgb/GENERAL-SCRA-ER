import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Clock } from "lucide-react";
import type { Business } from "@/lib/supabase";

interface FeedComponentProps {
  businesses: Business[];
  loading: boolean;
}

interface FeedPost {
  id: string;
  type: "announcement" | "listing";
  business: Business;
  content?: string;
  timestamp?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

export default function FeedComponent({ businesses, loading }: FeedComponentProps) {
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Generate feed posts from businesses (alternating between announcements and listings)
    const posts: FeedPost[] = [];

    businesses.forEach((business, index) => {
      const postType = index % 2 === 0 ? "announcement" : "listing";

      posts.push({
        id: `${business.id}-${postType}`,
        type: postType,
        business,
        content:
          postType === "announcement"
            ? `Check out our latest updates! Visit ${business.name} today.`
            : undefined,
        timestamp: `${Math.floor(Math.random() * 24)} hours ago`,
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 100),
      });
    });

    setFeedPosts(posts);
  }, [businesses]);

  const handleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-12 bg-gray-200 rounded-full w-32 mb-4" />
              <div className="h-24 bg-gray-200 rounded mb-4" />
              <div className="h-8 bg-gray-200 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
      {feedPosts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600 font-semibold mb-2">No businesses found</p>
          <p className="text-sm text-gray-500">
            Try selecting a different location or category
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg border-2 border-[#004E89]/20 hover:border-[#FF6B35]/50 overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              {/* Post Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] text-lg">
                      {post.business.name}
                    </h3>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <Clock size={12} /> {post.timestamp}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-[#FF6B35]/20 text-[#FF6B35] px-3 py-1 rounded-full">
                    {post.type === "announcement" ? "📢 Update" : "📍 Listing"}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              {post.type === "announcement" && post.content && (
                <div className="px-4 pt-4">
                  <p className="text-[#1A1A1A] text-sm leading-relaxed mb-3">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Image */}
              <div className="w-full h-64 bg-gray-200 overflow-hidden">
                <img
                  src={
                    post.business.image ||
                    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                  }
                  alt={post.business.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Post Info - Listings */}
              {post.type === "listing" && (
                <div className="px-4 pt-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Category</p>
                      <p className="text-sm font-bold text-[#004E89]">
                        {post.business.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Rating</p>
                      <p className="text-sm font-bold text-[#FF6B35]">
                        ⭐ {post.business.rating?.toFixed(1) || "N/A"}
                        <span className="text-gray-600 text-xs ml-1">
                          ({post.business.reviewCount})
                        </span>
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 font-semibold">Location</p>
                      <p className="text-sm font-bold text-[#1A1A1A]">
                        📍 {post.business.city}, {post.business.governorate}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement Section */}
              <div className="px-4 py-3 border-t border-gray-100">
                {/* Stats */}
                <div className="flex justify-between text-xs text-gray-600 font-semibold mb-3 pb-3 border-b border-gray-100">
                  <span>❤️ {post.likes} Likes</span>
                  <span>💬 {post.comments} Comments</span>
                  <span>📤 {post.shares} Shares</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-semibold transition-all duration-200 ${
                      likedPosts.has(post.id)
                        ? "bg-[#FF6B35]/20 text-[#FF6B35]"
                        : "bg-gray-100 text-gray-700 hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]"
                    }`}
                  >
                    <Heart
                      size={16}
                      className={likedPosts.has(post.id) ? "fill-current" : ""}
                    />
                    Like
                  </button>

                  <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-[#1AC8ED]/10 hover:text-[#1AC8ED] text-gray-700 rounded font-semibold transition-all duration-200">
                    <MessageCircle size={16} />
                    Comment
                  </button>

                  <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-[#004E89]/10 hover:text-[#004E89] text-gray-700 rounded font-semibold transition-all duration-200">
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>

              {/* Contact Button */}
              {post.type === "listing" && (
                <div className="px-4 py-3 bg-[#F7F7F7] border-t border-gray-100 flex gap-2">
                  {post.business.phone && (
                    <a
                      href={`tel:${post.business.phone}`}
                      className="flex-1 py-2 bg-[#004E89] hover:bg-[#003d6b] text-white text-sm font-bold rounded transition-colors duration-200 text-center"
                    >
                      📞 Call
                    </a>
                  )}
                  <button className="flex-1 py-2 bg-[#1AC8ED] hover:bg-[#00a8c9] text-[#004E89] text-sm font-bold rounded transition-colors duration-200">
                    📱 WhatsApp
                  </button>
                  <button className="flex-1 py-2 bg-[#FF6B35] hover:bg-[#e55a24] text-white text-sm font-bold rounded transition-colors duration-200">
                    👁️ View Profile
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Load More Button */}
          <div className="text-center pt-4">
            <button className="px-8 py-3 bg-[#004E89] hover:bg-[#003d6b] text-white font-bold rounded-lg transition-colors duration-200">
              Load More Businesses
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
