import React from "react";
import Link from "next/link";

const Navbar: React.FC = () => {
  return (
    <nav className="w-full bg-white dark:bg-zinc-900 shadow-sm py-4 px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="text-2xl font-bold text-black dark:text-zinc-50">
          NextApp
        </Link>
        {/* Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-zinc-700 dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/about" className="text-zinc-700 dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-zinc-700 dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
