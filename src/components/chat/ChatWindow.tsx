"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
};

type Props = {
  caseId: string;
  currentUserId: string;
};

export function ChatWindow({ caseId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/cases/${caseId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  }, [caseId]);

  // 初回取得 + 3秒ごとにポーリング
  useEffect(() => {
    fetchMessages();
    const timer = setInterval(fetchMessages, 3000);
    return () => clearInterval(timer);
  }, [fetchMessages]);

  // 新しいメッセージが来たら最下部にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);

    const res = await fetch(`/api/cases/${caseId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });

    if (res.ok) {
      setInput("");
      await fetchMessages();
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enterで送信、Shift+Enterで改行
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const roleLabel = (role: string) => {
    if (role === "HEADQUARTERS") return "本部";
    if (role === "HANDYMAN") return "便利屋";
    return "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            メッセージはまだありません
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender.id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
            >
              {/* 送信者名 */}
              <span className="text-xs text-gray-400 mb-1 px-1">
                {isMine ? "自分" : `${msg.sender.name}（${roleLabel(msg.sender.role)}）`}
              </span>
              {/* バブル */}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${
                  isMine
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
              {/* 時刻 */}
              <span className="text-xs text-gray-300 mt-1 px-1">
                {new Date(msg.createdAt).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t border-gray-200 p-3 flex gap-2 items-end bg-white">
        <textarea
          className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[120px]"
          placeholder="メッセージを入力（Enterで送信）"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="shrink-0"
          size="sm"
        >
          送信
        </Button>
      </div>
    </div>
  );
}
