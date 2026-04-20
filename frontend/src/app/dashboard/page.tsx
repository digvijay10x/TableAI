"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number | null;
  tags: string[];
  is_veg: boolean;
  is_available: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_order: number;
  menu_items: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  users: {
    email: string;
  } | null;
  order_items: OrderItem[];
}

type Tab = "menu" | "orders" | "analytics";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [loading, setLoading] = useState(true);

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    calories: "",
    tags: "",
    is_veg: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) {
      router.push("/login");
      return;
    }
    if (role !== "restaurant") {
      router.push("/chat");
      return;
    }
    fetchMenu();
    fetchOrders();
  }, [router]);

  const fetchMenu = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/menu/my-menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch menu");
      const data = await res.json();
      setRestaurantId(data.restaurant_id);
      setMenuItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/orders/restaurant-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const addMenuItem = async () => {
    setFormError("");
    if (!formData.name || !formData.price) {
      setFormError("Name and price are required");
      return;
    }
    setFormLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          calories: formData.calories ? parseInt(formData.calories) : null,
          tags: formData.tags
            ? formData.tags.split(",").map((t) => t.trim().toLowerCase())
            : [],
          is_veg: formData.is_veg,
        }),
      });

      if (!res.ok) throw new Error("Failed to add item");

      setFormData({
        name: "",
        description: "",
        price: "",
        calories: "",
        tags: "",
        is_veg: true,
      });
      setShowAddForm(false);
      fetchMenu();
    } catch (err) {
      setFormError("Failed to add menu item");
    } finally {
      setFormLoading(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API_URL}/menu/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_available: !item.is_available }),
      });
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API_URL}/menu/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
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

  const getNextStatus = (current: string): string | null => {
    const flow: Record<string, string> = {
      pending: "preparing",
      preparing: "ready",
      ready: "delivered",
    };
    return flow[current] || null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Analytics
  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.total_amount),
    0,
  );
  const totalOrders = orders.length;

  const itemCounts: Record<
    string,
    { name: string; count: number; revenue: number }
  > = {};
  orders.forEach((order) => {
    order.order_items.forEach((item) => {
      const name = item.menu_items?.name || "Unknown";
      if (!itemCounts[name]) {
        itemCounts[name] = { name, count: 0, revenue: 0 };
      }
      itemCounts[name].count += item.quantity;
      itemCounts[name].revenue += item.price_at_order * item.quantity;
    });
  });
  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const statusCounts = {
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-500 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Table<span className="text-accent">AI</span>
          <span className="text-white/30 text-sm font-normal ml-3">
            Restaurant Dashboard
          </span>
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm text-white/60 hover:text-red-400 transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-dark-500 bg-dark-800">
        <div className="max-w-5xl mx-auto flex">
          {(["menu", "orders", "analytics"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-accent text-accent"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              {tab}
              {tab === "orders" && statusCounts.pending > 0 && (
                <span className="ml-2 bg-accent text-dark-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  {statusCounts.pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* MENU TAB */}
        {activeTab === "menu" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Menu Items</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-accent text-dark-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-accent/90 transition-colors text-sm"
              >
                {showAddForm ? "Cancel" : "Add Item"}
              </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="bg-dark-800 border border-dark-500 rounded-xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">
                  Add New Menu Item
                </h3>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg text-sm"
                      placeholder="Dish name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">
                      Price (INR) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg text-sm"
                      placeholder="e.g. 250"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-white/70 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-lg text-sm"
                      placeholder="Short description of the dish"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) =>
                        setFormData({ ...formData, calories: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg text-sm"
                      placeholder="e.g. 350"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg text-sm"
                      placeholder="e.g. spicy, indian, comfort"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-white/70">Type:</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_veg: true })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        formData.is_veg
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-dark-700 text-white/50 border-dark-500"
                      }`}
                    >
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, is_veg: false })
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        !formData.is_veg
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-dark-700 text-white/50 border-dark-500"
                      }`}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>

                <button
                  onClick={addMenuItem}
                  disabled={formLoading}
                  className="mt-5 bg-accent text-dark-900 font-semibold px-6 py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 text-sm"
                >
                  {formLoading ? "Adding..." : "Add to Menu"}
                </button>
              </div>
            )}

            {/* Menu List */}
            {loading ? (
              <div className="text-white/50 text-center py-12">Loading...</div>
            ) : menuItems.length === 0 ? (
              <div className="text-white/40 text-center py-12">
                No menu items yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-dark-800 border rounded-xl p-5 flex items-start justify-between ${
                      item.is_available
                        ? "border-dark-500"
                        : "border-dark-600 opacity-60"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-semibold">
                          {item.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            item.is_veg
                              ? "text-green-400 border-green-500/30"
                              : "text-red-400 border-red-500/30"
                          }`}
                        >
                          {item.is_veg ? "VEG" : "NON-VEG"}
                        </span>
                        {!item.is_available && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-white/40 border-white/10">
                            UNAVAILABLE
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-sm mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-accent font-semibold">
                          Rs.{item.price}
                        </span>
                        {item.calories && (
                          <span className="text-white/30">
                            {item.calories} cal
                          </span>
                        )}
                      </div>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-dark-600 text-white/40 px-2 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          item.is_available
                            ? "text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                            : "text-green-400 border-green-500/30 hover:bg-green-500/10"
                        }`}
                      >
                        {item.is_available
                          ? "Mark Unavailable"
                          : "Mark Available"}
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-xs text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Incoming Orders</h2>
              <button
                onClick={fetchOrders}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Refresh
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-white/40 text-center py-12">
                No orders yet
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);

                  return (
                    <div
                      key={order.id}
                      className="bg-dark-800 border border-dark-500 rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-white/40 text-xs">
                            {order.users?.email || "Customer"}
                          </p>
                          <p className="text-white/30 text-xs mt-0.5">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full border capitalize ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {order.status}
                          </span>
                          {nextStatus && (
                            <button
                              onClick={() =>
                                updateOrderStatus(order.id, nextStatus)
                              }
                              className="bg-accent text-dark-900 text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-accent/90 transition-colors capitalize"
                            >
                              Mark {nextStatus}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
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

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-dark-500">
                        <span className="text-white/50 text-sm">Total</span>
                        <span className="text-accent font-semibold">
                          Rs.{order.total_amount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Analytics</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-dark-800 border border-dark-500 rounded-xl p-5">
                <p className="text-white/40 text-sm mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-accent">
                  Rs.{Math.round(totalRevenue)}
                </p>
              </div>
              <div className="bg-dark-800 border border-dark-500 rounded-xl p-5">
                <p className="text-white/40 text-sm mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-white">{totalOrders}</p>
              </div>
              <div className="bg-dark-800 border border-dark-500 rounded-xl p-5">
                <p className="text-white/40 text-sm mb-1">Menu Items</p>
                <p className="text-2xl font-bold text-white">
                  {menuItems.length}
                </p>
              </div>
              <div className="bg-dark-800 border border-dark-500 rounded-xl p-5">
                <p className="text-white/40 text-sm mb-1">Avg Order</p>
                <p className="text-2xl font-bold text-white">
                  Rs.
                  {totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}
                </p>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-dark-800 border border-dark-500 rounded-xl p-5 mb-6">
              <h3 className="text-white font-semibold mb-4">
                Order Status Breakdown
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-white/40 text-xs capitalize mt-1">
                      {status}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Items */}
            <div className="bg-dark-800 border border-dark-500 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">
                Top Ordered Items
              </h3>
              {topItems.length === 0 ? (
                <p className="text-white/30 text-sm">
                  No orders yet to show analytics
                </p>
              ) : (
                <div className="space-y-3">
                  {topItems.map((item, i) => {
                    const maxCount = topItems[0]?.count || 1;
                    const barWidth = (item.count / maxCount) * 100;

                    return (
                      <div key={item.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white/70 text-sm">
                            {i + 1}. {item.name}
                          </span>
                          <span className="text-white/40 text-xs">
                            {item.count} orders / Rs.{Math.round(item.revenue)}
                          </span>
                        </div>
                        <div className="w-full bg-dark-600 rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
