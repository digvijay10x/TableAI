"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "restaurant">("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      if (data.session) {
        localStorage.setItem("access_token", data.session.access_token);
        localStorage.setItem("user_role", role);
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("user_email", data.user.email);

        if (role === "customer") {
          router.push("/chat");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Table<span className="text-accent">AI</span>
          </h1>
          <p className="text-white/50">Create your account</p>
        </div>

        <div className="bg-dark-800 border border-dark-500 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign Up</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`py-3 rounded-lg text-sm font-medium transition-colors border ${
                    role === "customer"
                      ? "bg-accent text-dark-900 border-accent"
                      : "bg-dark-700 text-white/70 border-dark-500 hover:border-accent/50"
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("restaurant")}
                  className={`py-3 rounded-lg text-sm font-medium transition-colors border ${
                    role === "restaurant"
                      ? "bg-accent text-dark-900 border-accent"
                      : "bg-dark-700 text-white/70 border-dark-500 hover:border-accent/50"
                  }`}
                >
                  Restaurant Owner
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-dark-900 font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-white/40 text-sm text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
