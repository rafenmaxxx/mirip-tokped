import React, { forwardRef, useRef, useEffect } from "react";
import ChatBubble from "./chat_buble";
import { formatMessageTime } from "../lib/chat_utils";

const ChatMessageList = forwardRef(
  ({ messages, user, onLoadMore, hasMore, isLoadingMore }, ref) => {
    const containerRef = useRef(null);
    const lastScrollTopRef = useRef(0);
    const scrollTimeoutRef = useRef(null);
    console.log(user);

    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      console.log(scrollHeight, clientHeight);

      lastScrollTopRef.current = scrollTop;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (typeof window !== "undefined") {
        window.isUserScrolling = true;
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (typeof window !== "undefined") {
          window.isUserScrolling = false;
        }
      }, 500);

      if (scrollTop === 0 && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    };

    useEffect(() => {
      if (messages.length > 0 && containerRef.current) {
        setTimeout(() => {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }, 100);
      }
    }, [messages.length]);

    useEffect(() => {
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (ref) {
            ref.current = node;
          }
        }}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-6 bg-[url(/img/chat-background.png)] bg-repeat"
      >
        {hasMore && (
          <div className="text-center mb-4">
            {isLoadingMore ? (
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
            ) : (
              <button
                onClick={onLoadMore}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Muat pesan sebelumnya
              </button>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id || msg.timestamp} className="mb-4">
            <ChatBubble
              text={msg.text}
              mine={msg.mine}
              type={msg.type}
              time={formatMessageTime(msg.timestamp)}
              status={msg.status}
            />
          </div>
        ))}
      </div>
    );
  }
);

export default ChatMessageList;
