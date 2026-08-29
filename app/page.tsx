"use client";

import { FaGithub, FaMarkdown } from "react-icons/fa";
import { Copy, Search, Check } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [username, setUsername] = useState("xreactivee");
  const [debouncedUsername, setDebouncedUsername] = useState("xreactivee");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://xrs-readme-generator.vercel.app");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username || "xreactivee");
    }, 700);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const markdownCode = `[![My GitHub Stats](${origin}/api/generate?username=${debouncedUsername})](https://github.com/${debouncedUsername})`;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[url('/shape.png')] bg-cover bg-center flex flex-col items-center justify-center overflow-hidden px-6 gap-8">

      <div className="liquid-card flex items-center gap-3 px-6 py-3 rounded-full text-white relative z-10 shrink-0">
        <FaGithub size={24} />
        <h1 className="text-xl font-medium tracking-wide">GitHub Readme Generator</h1>
        <FaMarkdown size={24} />
      </div>

      <div className="liquid-card w-full max-w-3xl rounded-4xl p-8 md:p-12 flex flex-col items-center gap-6 relative z-10">

        <div className="liquid-card h-14 w-[80%] md:w-[50%] rounded-full flex items-center px-5 focus-within:ring-2 focus-within:ring-white/20 transition-all cursor-text">
          <Search size={18} className="text-white/50 shrink-0" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="GitHub Username"
            className="flex-1 bg-transparent border-none outline-none text-white px-3 h-full placeholder:text-white/30"
          />
        </div>

        <div className="liquid-card min-h-14 w-full rounded-2xl md:rounded-full flex flex-col md:flex-row items-center justify-between p-2 md:pl-6 gap-4">
          <code className="text-emerald-400/90 text-sm md:text-base font-mono break-all px-4 md:px-0 py-2 md:py-0 text-center md:text-left">
            {markdownCode}
          </code>
          <button
            onClick={handleCopy}
            className="liquid-card h-10 w-auto p-5 rounded-full text-white text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-400" />
              </>
            ) : (
              <>
                <Copy size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
        <Link
          href={`/api/generate?username=${debouncedUsername}`}
          target="_blank"
          prefetch={false}
          className="liquid-card px-6 py-3 rounded-full text-white text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
        >
          Open Image API
        </Link>
        <Link
          href={`/render?username=${debouncedUsername}`}
          target="_blank"
          prefetch={false}
          className="liquid-card px-6 py-3 rounded-full text-white text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
        >
          View HTML Render
        </Link>
      </div>

    </div>
  );
}