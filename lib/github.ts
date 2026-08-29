const GITHUB_API = "https://api.github.com";
const MAX_REQUEST_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 15000;

const cleanUrl = (v: any) => typeof v === "string" && /^https?:\/\//.test(v) ? v : null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const sanitizeCommitMessage = (value = "", limit = 50) => {
    const text = String(value || "").split("\n")[0].trim().replace(/\.\.\.+$/g, "").trim();
    if (!text) return "Commit updates";
    if (text.length > limit) return text.slice(0, limit - 3).trim() + "...";
    return text;
};

const serializeRepository = (r: any = {}) => ({ name: r.name || "unknown", fullName: r.full_name || r.fullName || r.name || "unknown", description: r.description || "", language: r.language || r.primaryLanguage?.name || "", stars: r.stargazers_count || r.stargazerCount || 0, forks: r.forks_count || r.forkCount || 0, watchers: r.watchers_count || 0, openIssues: r.open_issues_count || 0, private: r.private === true || r.isPrivate === true, updatedAt: r.updated_at || r.updatedAt || r.pushed_at || r.pushedAt || null, pushedAt: r.pushed_at || r.pushedAt || null, url: cleanUrl(r.html_url || r.url) });
const serializeCommit = (c: any = {}) => ({ sha: c.sha || "", shortSha: c.sha ? c.sha.slice(0, 7) : "", message: sanitizeCommitMessage(c.message, 50), repository: c.repository || "unknown/repository", url: cleanUrl(c.url), date: c.date || null });

class GitHubApiError extends Error {
    status: number; endpoint: string; apiMessage: string; headers: Headers;
    constructor(status: number, endpoint: string, message: string, headers: Headers) { super("GitHub API " + status + " for " + endpoint + ": " + message); this.name = "GitHubApiError"; this.status = status; this.endpoint = endpoint; this.apiMessage = message; this.headers = headers; }
}
const isRateLimitError = (s: number, m: string, h: Headers) => s === 429 || (s === 403 && (h.get("x-ratelimit-remaining") === "0" || /rate limit|secondary rate|abuse detection|too many requests/i.test(m)));
const isRateLimitedApiError = (e: any) => e && isRateLimitError(e.status, e.apiMessage || e.message || "", e.headers || new Headers());

const request = async (endpoint: string, options: any = {}) => {
    const { authenticated = true } = options;
    const ACCESS_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || "";
    const headers: any = { Accept: "application/vnd.github+json", "User-Agent": "xreactive-readme-generator", "X-GitHub-Api-Version": "2022-11-28" };
    if (ACCESS_TOKEN && authenticated) headers.Authorization = "Bearer " + ACCESS_TOKEN;
    for (let attempt = 0; attempt <= MAX_REQUEST_RETRIES; attempt++) {
        const res = await fetch(GITHUB_API + endpoint, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        const body = await res.text();
        let payload: any = {}; try { payload = body ? JSON.parse(body) : {}; } catch { payload = { message: body || res.statusText }; }
        if (res.ok) return payload;
        const msg = payload.message || res.statusText || "Unknown error";
        if (!isRateLimitError(res.status, msg, res.headers) || attempt === MAX_REQUEST_RETRIES) throw new GitHubApiError(res.status, endpoint, msg, res.headers);
        const ra = Number(res.headers.get("retry-after")); const delay = (Number.isFinite(ra) && ra > 0) ? ra * 1000 : Math.max(60000, 1000 * 2 ** attempt);
        if (delay > 60000) throw new GitHubApiError(res.status, endpoint, msg, res.headers);
        console.warn("Rate limit on " + endpoint + "; retry in " + Math.ceil(delay / 1000) + "s"); await sleep(delay);
    }
    throw new Error("Request failed for " + endpoint);
};

const publicRequest = async (endpoint: string) => {
    try { return await request(endpoint); } catch (error: any) {
        if (error.status === 401 || (error.status === 403 && !isRateLimitedApiError(error))) return request(endpoint, { authenticated: false });
        throw error;
    }
};

const fetchGraphQLViewer = async () => {
    const ACCESS_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || "";
    if (!ACCESS_TOKEN) return null;
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const query = `query($from: DateTime!) {
        viewer {
            login name bio
            followers { totalCount }
            following { totalCount }
            contributionsCollection(from: $from) { totalCommitContributions restrictedContributionsCount }
            repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], orderBy: {field: UPDATED_AT, direction: DESC}) {
                nodes {
                    name nameWithOwner isPrivate isFork description url updatedAt pushedAt
                    primaryLanguage { name } stargazerCount forkCount
                    owner { __typename login avatarUrl }
                }
            }
        }
        privateSearch: search(query: "is:private", type: REPOSITORY, first: 100) {
            nodes {
                ... on Repository {
                    name nameWithOwner isPrivate isFork description url updatedAt pushedAt
                    primaryLanguage { name } stargazerCount forkCount
                    owner { __typename login avatarUrl }
                }
            }
        }
    }`;
    try {
        const res = await fetch("https://api.github.com/graphql", { method: "POST", headers: { Authorization: "Bearer " + ACCESS_TOKEN, "Content-Type": "application/json", "User-Agent": "xreactive-readme-generator" }, body: JSON.stringify({ query, variables: { from: oneYearAgo } }), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        const json = await res.json();
        if (json.data?.viewer) {
            const v = json.data.viewer;
            const repoNodes = v.repositories?.nodes || [];
            const privNodes = (json.data?.privateSearch?.nodes || []).filter(Boolean);
            const nodeMap = new Map();
            for (const n of [...repoNodes, ...privNodes]) {
                if (n?.nameWithOwner) nodeMap.set(n.nameWithOwner.toLowerCase(), n);
            }
            v._allNodes = [...nodeMap.values()];
            return v;
        }
    } catch (err: any) { console.warn("[GraphQL] " + err.message); }
    return null;
};

const fetchCommitsFromRepos = async (username: string, repos = []) => {
    const map = new Map();
    const sorted = [...repos].sort((a: any, b: any) => {
        const ta = new Date(a.updated_at || a.pushedAt || 0).getTime();
        const tb = new Date(b.updated_at || b.pushedAt || 0).getTime();
        return tb - ta;
    }).slice(0, 5);

    await Promise.all(sorted.map(async (repo: any) => {
        const fn = repo.full_name || repo.nameWithOwner || "";
        if (!fn || !fn.includes("/")) return;
        try {
            let commits = await request("/repos/" + fn + "/commits?author=" + encodeURIComponent(username) + "&per_page=10").catch(() => []);
            if (!Array.isArray(commits) || commits.length === 0) {
                commits = await request("/repos/" + fn + "/commits?per_page=10").catch(() => []);
            }
            if (Array.isArray(commits)) {
                for (const c of commits) {
                    if (c?.sha && !map.has(c.sha)) map.set(c.sha, { sha: c.sha, message: sanitizeCommitMessage(c.commit?.message, 50), repository: fn, url: c.html_url || ("https://github.com/" + fn + "/commit/" + c.sha), date: c.commit?.author?.date || c.commit?.committer?.date });
                }
            }
        } catch { }
    }));
    return [...map.values()];
};

const getRecentCommits = async (username: string, repos: any[] = [], viewer: any = null, limit = 5) => {
    const unique = new Map();
    let pubCount = 0, privCount = 0;
    if (viewer?.contributionsCollection) { pubCount = Number(viewer.contributionsCollection.totalCommitContributions) || 0; privCount = Number(viewer.contributionsCollection.restrictedContributionsCount) || 0; }

    try { const rc = await fetchCommitsFromRepos(username, repos as any); for (const c of rc) if (c.sha) unique.set(c.sha, c); } catch { }
    try { const q = new URLSearchParams({ q: "author:" + username, sort: "author-date", order: "desc", per_page: "50" }); const sr = await request("/search/commits?" + q).catch(() => null); if (sr?.items) for (const i of sr.items) { const c = { sha: i.sha, message: sanitizeCommitMessage(i.commit?.message, 50), repository: i.repository?.full_name || "unknown/repository", url: i.html_url, date: i.commit?.author?.date || i.commit?.committer?.date }; if (c.sha && !unique.has(c.sha)) unique.set(c.sha, c); } } catch { }

    if (!viewer?.contributionsCollection) pubCount = unique.size;
    const items = [...unique.values()].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, limit);
    const total = Math.max(pubCount + privCount, unique.size);
    return { total, publicTotal: pubCount, privateTotal: privCount, items };
};

const getRepositories = async (username: string, viewer: any = null) => {
    const map = new Map();
    const ACCESS_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || "";
    const isViewer = viewer?.login?.toLowerCase() === username.toLowerCase();

    const addNode = (n: any) => {
        if (!n?.nameWithOwner) return;
        const k = n.nameWithOwner.toLowerCase();
        const isOrg = n.owner?.__typename === "Organization";
        map.set(k, {
            name: n.name,
            full_name: n.nameWithOwner,
            nameWithOwner: n.nameWithOwner,
            description: n.description || "",
            language: n.primaryLanguage?.name || "",
            stargazers_count: n.stargazerCount || 0,
            forks_count: n.forkCount || 0,
            private: n.isPrivate === true,
            fork: n.isFork === true,
            updated_at: n.updatedAt || n.pushedAt || null,
            pushed_at: n.pushedAt || null,
            html_url: n.url,
            owner: n.owner ? { login: n.owner.login, avatar_url: n.owner.avatarUrl, type: isOrg ? "Organization" : "User" } : null
        });
    };

    if (isViewer && viewer?._allNodes) {
        for (const n of viewer._allNodes) addNode(n);
    }

    if (ACCESS_TOKEN && isViewer) {
        try {
            const rs = await request("/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&sort=updated&direction=desc&per_page=100");
            if (Array.isArray(rs)) {
                for (const r of rs) {
                    const k = (r.full_name || "").toLowerCase();
                    if (r && k && !map.has(k)) map.set(k, r);
                }
            }
        } catch (e) {
            console.error("Failed /user/repos", e);
        }
    } else {
        try {
            const pr = await publicRequest("/users/" + encodeURIComponent(username) + "/repos?type=owner&sort=updated&direction=desc&per_page=100");
            if (Array.isArray(pr)) {
                for (const r of pr) {
                    const k = (r.full_name || "").toLowerCase();
                    if (r && k && !map.has(k)) map.set(k, r);
                }
            }
        } catch { }
    }

    return [...map.values()];
};

export const fetchBase64 = async (url: string) => {
    if (!url) return null;
    if (url.startsWith("data:")) return url;
    if (url.startsWith("http")) {
        try {
            const res = await fetch(url);
            const buffer = await res.arrayBuffer();
            const type = res.headers.get("content-type") || "image/png";
            return `data:${type};base64,${Buffer.from(buffer).toString("base64")}`;
        } catch (e) { return null; }
    }
    return null;
};

export const collectProfile = async (username: string, bg?: string) => {
    let viewer = await fetchGraphQLViewer().catch(() => null);
    const isViewer = viewer?.login?.toLowerCase() === username.toLowerCase();

    if (!isViewer) viewer = null;

    const userProfile = await publicRequest("/users/" + encodeURIComponent(username)).catch(() => ({}));
    if (!userProfile.login && !viewer) {
        throw new Error("User not found");
    }

    const repos = await getRepositories(username, viewer).catch(() => []);
    const commits = await getRecentCommits(username, repos, viewer, 5).catch(() => ({ total: 0, publicTotal: 0, privateTotal: 0, items: [] }));

    const displayRepos = repos.filter((r: any) => r && !r.fork).sort((a: any, b: any) => {
        const ta = new Date(a.updated_at || a.pushed_at || 0).getTime();
        const tb = new Date(b.updated_at || b.pushed_at || 0).getTime();
        return tb - ta;
    }).slice(0, 5);

    const socials = await publicRequest("/users/" + encodeURIComponent(username) + "/social_accounts").catch(() => []);

    const avatarBase64 = await fetchBase64(viewer?.avatarUrl || userProfile.avatar_url || "");

    const profileData = {
        username, name: viewer?.name || userProfile.name || username,
        bio: viewer?.bio || userProfile.bio || "Software Engineer",
        avatarUrl: viewer?.avatarUrl || userProfile.avatar_url || "",
        avatarBase64,
        location: userProfile.location || "-",
        website: userProfile.blog || "-",
        socials: socials.map((s: any) => ({ provider: s.provider, url: s.url })),
        twitter: userProfile.twitter_username || "-", // Fallback if old twitter_username field is used
        pronouns: "",
        followers: viewer?.followers?.totalCount || userProfile.followers || 0,
        following: viewer?.following?.totalCount || userProfile.following || 0,
        totalRepos: repos.length,
        publicRepos: userProfile.public_repos ?? repos.filter((r: any) => !r.private).length,
        repositories: displayRepos.map(serializeRepository),
        commits: commits.items.map(serializeCommit),
        backgroundImage: bg || "/shape.png"
    };

    return profileData;
};
