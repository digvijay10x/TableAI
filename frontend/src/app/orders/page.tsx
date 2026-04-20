"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface OrderItem {
  id: string;
  quantity: number;
  price_at_order: number;
  menu_items: {
    name: string;
    price: number;
  } | null;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  restaurants: {
    name: string;
  } | null;
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "preparing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "ready":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "delivered":
        return "bg-white/5 text-white/50 border-white/10";
      default:
        return "bg-white/5 text-white/50 border-white/10";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            onClick={() => router.push("/profile")}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            My Taste Profile
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

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Past Orders</h2>

        {loading ? (
          <div className="text-white/50 text-center py-12">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/40 mb-4">No orders yet</p>
            <button
              onClick={() => router.push("/chat")}
              className="bg-accent text-dark-900 font-semibold px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-dark-800 border border-dark-500 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">
                      {order.restaurants?.name || "Unknown Restaurant"}
                    </h3>
                    <p className="text-white/40 text-xs mt-1">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full border capitalize ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-white/70">
                        {item.menu_items?.name || "Item"} x{item.quantity}
                      </span>
                      <span className="text-white/50">
                        Rs.{item.price_at_order * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-dark-500">
                  <span className="text-white/50 text-sm">Total</span>
                  <span className="text-accent font-semibold">
                    Rs.{order.total_amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
