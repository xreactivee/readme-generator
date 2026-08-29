import { MapPin, Link as LinkIcon } from "lucide-react";
import {
  FaXTwitter, FaInstagram, FaLinkedin, FaYoutube,
  FaTwitch, FaFacebook, FaGithub, FaReddit,
  FaMastodon, FaDiscord, FaMedium, FaNpm, FaPatreon, FaGoogle
} from "react-icons/fa6";

const getSocialIcon = (provider: string) => {
  const p = provider.toLowerCase();
  if (p.includes("twitter") || p.includes("x")) return <FaXTwitter size={16} />;
  if (p.includes("instagram")) return <FaInstagram size={16} />;
  if (p.includes("linkedin")) return <FaLinkedin size={16} />;
  if (p.includes("youtube")) return <FaYoutube size={16} />;
  if (p.includes("twitch")) return <FaTwitch size={16} />;
  if (p.includes("facebook")) return <FaFacebook size={16} />;
  if (p.includes("github")) return <FaGithub size={16} />;
  if (p.includes("reddit")) return <FaReddit size={16} />;
  if (p.includes("mastodon")) return <FaMastodon size={16} />;
  if (p.includes("discord")) return <FaDiscord size={16} />;
  if (p.includes("medium")) return <FaMedium size={16} />;
  if (p.includes("npm")) return <FaNpm size={16} />;
  if (p.includes("patreon")) return <FaPatreon size={16} />;
  if (p.includes("google") || p.includes("g")) return <FaGoogle size={16} />;
  return <LinkIcon size={16} />;
};

const formatSocialUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname.replace(/^\/|\/$/g, "");
    if (!path) return parsed.hostname.replace(/^www\./, "");
    return path.split("/").pop() || path;
  } catch {
    return url;
  }
};
import { collectProfile } from "@/lib/github";

function formatRelativeTime(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

function formatCount(count: number) {
  if (!count) return "-";
  if (count < 1000) return count.toString();
  return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
}

export const dynamic = "force-dynamic";

export default async function RenderPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string; bg?: string; pronouns?: string; }>;
}) {
  const params = await searchParams;
  const username = params.username || "";
  const pronouns = params?.pronouns || "";

  let profile = null;
  try {
    profile = await collectProfile(username, params.bg);
  } catch (e) {
    console.error("Failed to fetch profile", e);
    return <div className="text-white p-10">Error fetching user: {username}</div>;
  }

  const displayName = profile?.name || profile?.username || "John Doe";
  const displayUsername = profile?.username || "username";
  const bio = profile?.bio || "I am a developer.";
  const location = profile?.location || "-";
  const website = profile?.website || "-";
  const twitter = profile?.twitter || "-";

  const avatarUrl = profile?.avatarBase64 || profile?.avatarUrl || "https://github.com/identicons/johndoe.png";

  const commits = profile?.commits || [];
  const repos = profile?.repositories || [];

  const bgUrl = profile?.backgroundImage || "/shape.png";

  return (
    <div
      className={`relative h-screen bg-cover bg-center flex flex-col overflow-hidden px-15`}
      style={{ backgroundImage: `url(${bgUrl})` }}
      id="render-container"
    >
      <div className="liquid-card mt-10 w-full h-55 rounded-4xl px-15 py-5 flex gap-10 shrink-0 relative z-10">
        <div
          className="rounded-full bg-white h-full w-45 shadow-md shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        ></div>

        <div className="flex flex-col justify-between h-full py-2 text-white w-full">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-semibold tracking-tight">{displayName}</h1>
            <div className="liquid-card px-3 py-1 rounded-full">
              <span className="text-white font-light">{username}{pronouns ? ` · ${pronouns}` : ''}</span>
            </div>
          </div>
          <p className="text-2xl text-[#DCDCDC] font-medium line-clamp-2">
            {bio}
          </p>
          <div className="flex flex-wrap gap-3">
            {location !== "-" && <SocialBadge icon={<MapPin size={16} />} text={location} />}
            {website !== "-" && <SocialBadge icon={<LinkIcon size={16} />} text={website.replace(/^https?:\/\//, "")} />}
            {profile?.socials?.map((social: any, idx: number) => (
              <SocialBadge key={idx} icon={getSocialIcon(social.provider)} text={formatSocialUrl(social.url)} />
            ))}
            {twitter !== "-" && !profile?.socials?.some((s: any) => s.provider === "twitter") && (
              <SocialBadge icon={<FaXTwitter size={16} />} text={twitter} />
            )}
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-[2fr_1fr] gap-x-6 gap-y-4 mt-8 relative z-10 flex-1 content-start">
        {Array.from({ length: 5 }).map((_, index) => {
          const commit = commits[index];
          const repo = repos[index];

          return (
            <div key={index} className="contents">
              <div className="liquid-card h-14 rounded-full w-full flex items-center px-6 justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${commit ? 'bg-teal-400' : 'bg-slate-600'}`}></div>
                  <span className="text-white font-medium truncate text-sm">
                    {commit?.message || "No recent commit data"}
                  </span>
                </div>
                <div className="flex gap-4 shrink-0 text-sm">
                  <span className="text-slate-400 w-32 truncate text-right">{commit?.repository ? commit.repository.split('/')[1] : "-"}</span>
                  <span className="text-sky-400 w-16 text-right">{formatRelativeTime(commit?.date)}</span>
                </div>
              </div>

              <div className="liquid-card h-14 rounded-full w-full flex items-center px-6 justify-between gap-4">
                <div className="flex items-center gap-4 overflow-hidden">
                  <span className="text-sky-400 font-bold text-xs">{(index + 1).toString().padStart(2, '0')}</span>
                  <span className="text-white font-bold truncate text-sm">
                    {repo?.name || "No repository data"}
                  </span>
                </div>
                <div className="flex gap-4 shrink-0 text-sm">
                  <span className="text-slate-400 uppercase text-xs w-16">{repo?.language || "-"}</span>
                  <span className="text-slate-400 w-16 text-right">{formatCount(repo?.stars)} stars</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-linear-to-t from-black to-transparent pointer-events-none z-0"></div>

      <div className="absolute bottom-8 left-0 w-full px-15 z-20">
        <div className="border-t border-white/20 pt-4 flex justify-between items-center text-sm">
          <span className="font-mono text-slate-400">github.com/{displayUsername}</span>
          <span className="font-normal text-white">Powered by <span className="text-white font-semibold italic">xreactive.xyz</span></span>
        </div>
      </div>

    </div>
  );
}

function SocialBadge({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full liquid-card shrink-0">
      <span className="text-white flex items-center justify-center">
        {icon}
      </span>
      <span className="text-sm font-medium text-white">{text}</span>
    </div>
  );
}
