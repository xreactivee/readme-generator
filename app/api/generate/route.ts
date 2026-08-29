import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";

const imageCache = new Map<string, { buffer: Buffer, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let username = searchParams.get("username");
    let pronouns = searchParams.get("pronouns");

    if (username && username.includes("?")) {
      const parts = username.split("?");
      username = parts[0];
      pronouns = searchParams.get("pronouns");
    }

    if (!username) {
      return new NextResponse("Username is required", { status: 400 });
    }

    const renderUrl = new URL(`/render`, req.url);
    renderUrl.searchParams.set("username", username);
    if (searchParams.has("bg")) renderUrl.searchParams.set("bg", searchParams.get("bg") as string);
    if (searchParams.has("pronouns")) renderUrl.searchParams.set("pronouns", searchParams.get("pronouns") as string);

    const cacheKey = renderUrl.toString();
    const cachedItem = imageCache.get(cacheKey);
    if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
      console.log("Serving from in-memory cache:", cacheKey);
      return new NextResponse(cachedItem.buffer as any, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    }
    const isLocal = process.env.NODE_ENV === "development";
    let executablePath = null;

    if (isLocal) {
      const paths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
      if (!executablePath) throw new Error("Local browser not found. Please install Chrome or Edge.");
    } else {
      executablePath = await chromium.executablePath();
    }

    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: { width: 1280, height: 860, deviceScaleFactor: 2 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(renderUrl.toString(), {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const buffer = await page.screenshot({ type: "png" });

    await browser.close();
    imageCache.set(cacheKey, { buffer: Buffer.from(buffer), timestamp: Date.now() });

    return new NextResponse(Buffer.from(buffer) as any, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": isLocal ? "no-store, max-age=0" : "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Error generating image:", error);
    return new NextResponse(`Error generating image: ${error.message}`, { status: 500 });
  }
}
