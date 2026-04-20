"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");

    if (token && role) {
      if (role === "customer") {
        router.push("/chat");
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <p className="text-white/50">Loading...</p>
    </div>
  );
}
