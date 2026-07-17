"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { markNotificationsRead } from "@/app/notifications/actions";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const unreadCount = items.filter((n) => !n.read_at).length;

  async function handleToggle() {
    const opening = !open;
    setOpen(opening);

    if (opening && unreadCount > 0) {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
      await markNotificationsRead();
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-outside catcher */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-neutral-200 bg-white shadow-lg">
            <div className="border-b border-neutral-200 px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-500">
                No notifications yet.
              </p>
            ) : (
              <ul className="max-h-96 divide-y divide-neutral-100 overflow-y-auto">
                {items.map((n) => {
                  const body = (
                    <div className={`px-4 py-3 ${!n.read_at ? "bg-indigo-50" : ""}`}>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-neutral-500">{n.body}</p>
                      )}
                    </div>
                  );

                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => setOpen(false)}
                          className="block hover:bg-neutral-50"
                        >
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
