# readme-generator

readme-generator — a Next.js app that generates dynamic, embeddable GitHub stats cards for your profile README.

## Features
- Generate dynamic GitHub stats cards by querying GitHub profiles and rendering them via Puppeteer
- Embeddable markdown output for profile READMEs with one-click copying
- In-memory caching layer with TTL to optimize rendering and serve cached PNG stats images
- Built with modern web technologies including Tailwind CSS v4 and Lucide React icons

## Tech Stack
- TypeScript
- Next.js
- React
- Tailwind CSS
- Puppeteer

## Installation
```bash
git clone https://github.com/xreactivee/readme-generator.git
cd readme-generator
npm install
```

## Usage
Run the development server:
```bash
npm run dev
```

## Promo Film
Open `promo/index.html` in a browser for a 39-second launch film. It is plain HTML, CSS and JavaScript; every sound is synthesized with the Web Audio API, so there are no media files.

`promo/instagram-post.png` is a matching 1080 × 1350 Instagram post; its source is `promo/instagram-post.html`.

## License
MIT