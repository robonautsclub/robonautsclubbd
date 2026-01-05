import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-6 mt-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-6">
        <span className="text-zinc-600 dark:text-zinc-400 text-sm">
          © {new Date().getFullYear()} NextApp. All rights reserved.
        </span>
        <div className="flex mt-3 sm:mt-0 gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            aria-label="GitHub"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            aria-label="Twitter"
          >
            Twitter
          </a>
          <a
            href="/privacy"
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
