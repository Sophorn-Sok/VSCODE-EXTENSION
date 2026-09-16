# Dev Companion AI

A helper inside **VS Code** or **Cursor**. It uses AI on **your computer** (Ollama) to:

- explain failed terminal commands
- find API routes in the project
- draw the folder structure
- check npm packages (outdated / security)
- generate unit tests
- generate documentation

Your source code is **not** sent to a cloud AI.

This extension is **not** on the public store yet. People use it by installing the `.vsix` file (see below).

---

## What you need before you start

1. **VS Code** (1.93 or newer) or **Cursor**
2. **[Ollama](https://ollama.com)** installed on your computer
3. The model **qwen3:8b** downloaded once
4. The install file **`dev-companion-ai-0.1.0.vsix`** (in this project, or sent to you)

You do **not** need this project’s source code if someone only sent you the `.vsix`.

---

## 1. Set up Ollama (do this once)

1. Install Ollama from [https://ollama.com](https://ollama.com) and open the app.
2. On a Mac, you should see a small Ollama icon on the **right side of the menu bar**. If it is there, Ollama is running.
3. Open **Terminal** and run (only the first time):

```bash
ollama pull qwen3:8b
```

4. Check that it is working:

```bash
ollama list
```

If you see `qwen3:8b`, you are ready.  
If you see “could not connect”, open the Ollama app and wait a few seconds, then try `ollama list` again.

You usually **do not** need to type `ollama serve` if the Ollama app is already in the menu bar.

---

## 2. Install the extension

1. Open VS Code or Cursor.
2. Open **Extensions** (left sidebar).
3. Click the **⋯** (three dots) at the top of the Extensions view.
4. Choose **Install from VSIX…**
5. Select `dev-companion-ai-0.1.0.vsix`.
6. Reload the editor if it asks you to.

Then open **any folder** that is a real project (File → Open Folder). The extension needs a folder; it will not work on a single loose file.

---

## 3. How to use it

1. Confirm Ollama is running (menu-bar icon, or `ollama list`).
2. Look at the **left bar** and click **Dev Companion AI**.
3. Click an action, for example **Scan API Endpoints**.

You can also press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows) and type **Dev Companion**.

| Action | What you get |
| --- | --- |
| **Scan API Endpoints** | A table of APIs (method, path, file, copyable command) |
| **Visualize Architecture** | A picture of the folders; you can export SVG or PNG |
| **Analyze Dependencies** | Outdated packages and security findings, plus a short AI summary |
| **Generate Documentation** | Two files in your project: `API_Documentation.md` and `Architecture_Guide.md` |
| **Generate Unit Tests** | Right-click a JavaScript/TypeScript file (or selected code) → Generate Unit Tests |
| **Explain Last Terminal Error** | Re-explains the last failed terminal command |
| **Open Settings** | Change the AI model or Ollama address |

**Tip:** Documentation is better if you run **Scan API Endpoints** and **Visualize Architecture** first.

**Tip:** The first AI action can take a few minutes. Generating documentation can take longer because it writes text for many files. Wait until it finishes.

Failed terminal commands are also explained **automatically** if the editor’s terminal shell integration is on.

---

## 4. How to know it is working

- Bottom-right of the editor: **Dev Companion** with no warning → it can talk to Ollama.
- A warning / “could not reach” → Ollama is off or still starting. Open the Ollama app, wait, then click **Retry** or run the action again.

---

## 5. Settings (only if you need them)

Editor Settings → search **Dev Companion AI**:

| Setting | Default | When to change it |
| --- | --- | --- |
| Model | `qwen3:8b` | If you installed a different Ollama model |
| Ollama URL | `http://127.0.0.1:11434` | Only if Ollama is not on the usual address |
| API base URL | `http://localhost:3000` | The host used in generated copy-paste API commands |

You can also put a `config.json` in the project folder. If you set values in Settings, those win.

---

## 6. How to stop it

- Close VS Code / Cursor, or disable the extension in Extensions.
- That does **not** stop Ollama. To stop the AI app on a Mac, quit **Ollama** from the menu-bar icon.

---

## Known Issues

- **Generate Unit Tests / Generate Documentation may time out** on longer AI responses — this is a known limitation currently being investigated. See `docs/qa-report-2026-09-15.md` for details.
- The default model (`qwen3:8b`) requires significant RAM to load. If you experience out-of-memory errors or repeated failures, try a lighter model such as `llama3:latest` in Settings.

---

## If something goes wrong

| Problem | What to try |
| --- | --- |
| “Could not reach ollama” | Open the Ollama app. Run `ollama list`. Wait, then try again. |
| On a Mac, F5 starts Voice | Do not use F5. This is only for people **developing** the extension (see below). |
| No APIs found | Open a project that uses Express or NestJS routes. |
| Generate Documentation is slow | Normal on a laptop. Leave it running. |
| Cursor log shows `UserNotLoggedInError` | That is Cursor login, not this extension. Sign in to Cursor if you use Cursor’s own AI. |

---

## For developers (this project folder)

If you have the **source code** and want to run it without installing the `.vsix`:

1. Open this folder in VS Code or Cursor.
2. Run `npm install`.
3. **Run and Debug** → **Run Extension** (green play). On a Mac do **not** press F5 (that can start Voice). Use **Fn+F5** or **Debug: Start Debugging**.
4. A second window opens on `sample-workspace`. Use Dev Companion there.

To rebuild the install file:

```bash
npm install
npm test
npm run package
```

That creates `dev-companion-ai-0.1.0.vsix` again.

---

## Privacy

AI calls go to **Ollama on your machine** (`127.0.0.1`). Nothing is uploaded to a public AI website by this extension.
# VSCODE-EXTENSION
