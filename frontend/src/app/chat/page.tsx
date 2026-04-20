"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  restaurant_id: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<OrderItem[] | null>(null);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token) {
      router.push("/login");
      return;
    }
    if (role === "restaurant") {
      router.push("/dashboard");
      return;
    }
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    // Add empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.content) {
                fullResponse += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: fullResponse,
                  };
                  return updated;
                });
              }

              if (data.done) {
                // Check if response contains order confirmation
                const orderMatch = fullResponse.match(
                  /ORDER_CONFIRMED:(\{.*\})/s,
                );
                if (orderMatch) {
                  try {
                    const orderData = JSON.parse(orderMatch[1]);
                    setPendingOrder(orderData.items);
                    // Remove the ORDER_CONFIRMED part from displayed message
                    const cleanMessage = fullResponse
                      .replace(/ORDER_CONFIRMED:\{.*\}/s, "")
                      .trim();
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        role: "assistant",
                        content:
                          cleanMessage ||
                          "Great! I have your order ready. Please confirm below.",
                      };
                      return updated;
                    });
                  } catch (e) {
                    // JSON parse failed, ignore
                  }
                }
              }
            } catch (e) {
              // Skip malformed JSON lines
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const confirmOrder = async () => {
    if (!pendingOrder || orderPlacing) return;
    setOrderPlacing(true);

    try {
      const token = localStorage.getItem("access_token");
      const restaurantId = pendingOrder[0]?.restaurant_id;

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          items: pendingOrder.map((item) => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to place order");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Order placed successfully! You can track it in your Past Orders page. What else can I help you with?",
        },
      ]);
      setPendingOrder(null);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to place the order. Please try again.",
        },
      ]);
    } finally {
      setOrderPlacing(false);
    }
  };

  const cancelOrder = () => {
    setPendingOrder(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Order cancelled. No worries! Tell me what else you are looking for.",
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-500 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">
          Table<span className="text-accent">AI</span>
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/orders")}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Past Orders
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            My Taste Profile
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-white/60 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              What are you craving?
            </h2>
            <p className="text-white/40 mb-8 max-w-md">
              Tell me what you want in plain English. I will search restaurants,
              filter by your preferences, and find the best matches.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {[
                "Something spicy under 300 calories",
                "Veg comfort food, budget 200 rupees",
                "I want a pizza with a dessert",
                "High protein non-veg meal",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                  className="text-left text-sm bg-dark-700 border border-dark-500 text-white/70 rounded-lg px-4 py-3 hover:border-accent/50 hover:text-white transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-accent text-dark-900"
                  : "bg-dark-700 text-white border border-dark-500"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" &&
                isStreaming &&
                i === messages.length - 1 && (
                  <span className="inline-block w-1.5 h-4 bg-accent ml-1 animate-pulse" />
                )}
            </div>
          </div>
        ))}

        {/* Order Confirmation Card */}
        {pendingOrder && (
          <div className="mb-4 bg-dark-700 border border-accent/30 rounded-xl p-5 max-w-[80%]">
            <h3 className="text-accent font-semibold mb-3">
              Confirm Your Order
            </h3>
            {pendingOrder.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2 border-b border-dark-500 last:border-0"
              >
                <span className="text-white text-sm">
                  {item.name} x{item.quantity}
                </span>
                <span className="text-white/70 text-sm">
                  Rs.{item.price * item.quantity}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-dark-500">
              <span className="text-white font-semibold">Total</span>
              <span className="text-accent font-semibold">
                Rs.
                {pendingOrder.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0,
                )}
              </span>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmOrder}
                disabled={orderPlacing}
                className="flex-1 bg-accent text-dark-900 font-semibold py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {orderPlacing ? "Placing..." : "Place Order"}
              </button>
              <button
                onClick={cancelOrder}
                className="flex-1 bg-dark-600 text-white/70 font-semibold py-2.5 rounded-lg hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-dark-800 border-t border-dark-500 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what you want to eat..."
            className="flex-1 px-4 py-3 rounded-lg text-sm bg-dark-700 border border-dark-500 focus:border-accent"
            disabled={isStreaming}
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="bg-accent text-dark-900 font-semibold px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isStreaming ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
