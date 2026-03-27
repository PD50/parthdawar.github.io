# parthdawar.github.io

Personal portfolio — React + Vite + Tailwind CSS + Framer Motion.

Live at **https://parthdawar.github.io**

---

## Deploy from scratch (one-time setup)

### 1. Prerequisites

Open Terminal on your Mac and run:

```bash
# Check if Node.js is installed
node -v

# If not installed:
brew install node

# Install pnpm (faster package manager)
npm install -g pnpm

# Check Git
git --version

# If not installed:
brew install git

# Set your Git identity (if not already done)
git config --global user.name "Parth Dawar"
git config --global user.email "your-email@example.com"
```

### 2. Create the GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Repo name: **`parthdawar.github.io`** (must match your username exactly)
3. Set to **Public**
4. Do **NOT** initialize with README, .gitignore, or license
5. Click **Create repository**

### 3. Set up the project locally

```bash
# Navigate to where you want the project (e.g. Desktop)
cd ~/Desktop

# If you downloaded the zip, unzip it first, then:
cd parthdawar.github.io

# Install dependencies
pnpm install

# Test locally
pnpm dev
# Opens at http://localhost:5173 — verify it works, then Ctrl+C to stop
```

### 4. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/parthdawar/parthdawar.github.io.git
git push -u origin main
```

> **If prompted for password:** GitHub no longer accepts passwords. You need a Personal Access Token:
> 1. Go to github.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
> 2. Generate new token, check the `repo` scope, copy it
> 3. Use the token as your password
>
> **Or set up SSH (recommended):**
> ```bash
> ssh-keygen -t ed25519 -C "your-email@example.com"
> cat ~/.ssh/id_ed25519.pub
> # Copy output → github.com → Settings → SSH Keys → Add
> git remote set-url origin git@github.com:parthdawar/parthdawar.github.io.git
> git push -u origin main
> ```

### 5. Enable GitHub Pages

1. Go to your repo on github.com
2. Click **Settings** (tab at the top)
3. In left sidebar, click **Pages**
4. Under "Build and deployment" → Source → select **GitHub Actions**
5. Done. The workflow file (`.github/workflows/deploy.yml`) handles everything.

### 6. Wait ~90 seconds

Go to the **Actions** tab in your repo to watch the build. Once the green checkmark appears, your site is live at:

**https://parthdawar.github.io**

---

## Updating the site

Every time you make changes:

```bash
git add .
git commit -m "update: description of what changed"
git push
```

GitHub Actions auto-rebuilds and redeploys in ~60 seconds.

---

## Local development

```bash
pnpm dev        # Start dev server with hot reload
pnpm build      # Production build → dist/
pnpm preview    # Preview production build locally
```

---

## Project structure

```
parthdawar.github.io/
├── .github/
│   └── workflows/
│       └── deploy.yml       ← auto-deploy on push
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx              ← all portfolio sections
│   ├── index.css            ← Tailwind + global styles
│   └── main.jsx             ← React entry point
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page after deploy | Clear browser cache (Cmd+Shift+R). Check Actions tab for build errors. |
| Actions workflow fails | Check the error in Actions tab. Usually a typo or missing dependency. |
| `permission denied` on push | Set up PAT or SSH keys (see Step 4 above). |
| Site not updating | Check Actions tab — build may still be running. Hard refresh the page. |
| Fonts not loading | Check browser console. Ad blockers can block Google Fonts. |

---

## Custom domain (optional)

If you buy a domain like `parthdawar.com`:

1. Repo Settings → Pages → Custom domain → enter `parthdawar.com` → Save
2. At your domain registrar, add DNS records:
   - `A` record → `185.199.108.153`
   - `A` record → `185.199.109.153`
   - `A` record → `185.199.110.153`
   - `A` record → `185.199.111.153`
   - `CNAME` www → `parthdawar.github.io`
3. Create `public/CNAME` with content: `parthdawar.com`
4. Check "Enforce HTTPS" in Pages settings after DNS propagates (~30 min)

---

Built with React, Vite, Tailwind CSS, and Framer Motion.
