import React from "react";

type FeedItem = {
  id: number;
  title: string;
  description: string;
  date: string;
};

const mockFeed: FeedItem[] = [
  {
    id: 1,
    title: "Welcome to the Feed!",
    description: "This is your first feed item. Feel free to explore and add more content.",
    date: "2024-06-01",
  },
  {
    id: 2,
    title: "Getting Started",
    description: "Learn how to use this app and customize your feed to see relevant updates.",
    date: "2024-06-02",
  },
  {
    id: 3,
    title: "Next.js & Tailwind CSS",
    description: "This feed leverages Next.js and Tailwind for a modern, responsive UI.",
    date: "2024-06-03",
  },
];

const Feed: React.FC = () => {
  return (
    <section className="w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Feed</h2>
      <ul className="flex flex-col gap-6">
        {mockFeed.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {item.title}
              </h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {item.date}
              </span>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Feed;
