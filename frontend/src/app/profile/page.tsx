"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface TasteProfile {
  preferred_tags: string[];
  avoided_tags: string[];
  avg_budget: number;
  total_orders: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAvoidTag, setNewAvoidTag] = useState("");
  const [saving, setSaving] = useState(false);
  const userEmail =
    typeof window !== "undefined" ? localStorage.getItem("user_email") : null;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/profile/taste`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addAvoidTag = async () => {
    if (!newAvoidTag.trim() || !profile) return;
    setSaving(true);

    const updatedTags = [
      ...profile.avoided_tags,
      newAvoidTag.trim().toLowerCase(),
    ];

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/profile/taste`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avoided_tags: updatedTags }),
      });

      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setProfile(data);
      setNewAvoidTag("");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const removeAvoidTag = async (tagToRemove: string) => {
    if (!profile) return;
    setSaving(true);

    const updatedTags = profile.avoided_tags.filter(
      (tag) => tag !== tagToRemove,
    );

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/profile/taste`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avoided_tags: updatedTags }),
      });

      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-500 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Table<span className="text-accent">AI</span>
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/chat")}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Chat
          </button>
          <button
            onClick={() => router.push("/orders")}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Past Orders
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="text-sm text-white/60 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-2">My Taste Profile</h2>
        <p className="text-white/40 text-sm mb-8">{userEmail || ""}</p>

        {loading ? (
          <div className="text-white/50 text-center py-12">Loading...</div>
        ) : !profile ? (
          <div className="text-white/40 text-center py-12">
            No taste profile found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-800 border border-dark-500 rounded-xl p-5">
                <p className="text-white/40 text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-accent">
                  {profile.total_orders}
                </p>
              </div>
              <div className="bg-dark-800 border border-dark-500 rounded-xl p-5">
                <p className="text-white/40 text-sm mb-1">Avg Budget</p>
                <p className="text-3xl font-bold text-accent">
                  Rs.{Math.round(profile.avg_budget)}
                </p>
              </div>
            </div>

            {/* Preferred Tags */}
            <div className="bg-dark-800 border border-dark-500 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">
                Preferred Flavors
              </h3>
              <p className="text-white/30 text-xs mb-3">
                Auto-learned from your orders
              </p>
              {profile.preferred_tags.length === 0 ? (
                <p className="text-white/30 text-sm">
                  No preferences yet. Start ordering to build your profile.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-accent/10 text-accent border border-accent/20 text-xs px-3 py-1.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Avoided Tags */}
            <div className="bg-dark-800 border border-dark-500 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Things I Avoid</h3>
              <p className="text-white/30 text-xs mb-3">
                The AI will skip dishes with these tags
              </p>

              {profile.avoided_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.avoided_tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-3 py-1.5 rounded-full flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => removeAvoidTag(tag)}
                        className="hover:text-red-300 text-[10px]"
                        disabled={saving}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAvoidTag}
                  onChange={(e) => setNewAvoidTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAvoidTag();
                    }
                  }}
                  placeholder="e.g. seafood, peanuts, gluten"
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-dark-700 border border-dark-500 focus:border-accent"
                />
                <button
                  onClick={addAvoidTag}
                  disabled={saving || !newAvoidTag.trim()}
                  className="bg-accent text-dark-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
