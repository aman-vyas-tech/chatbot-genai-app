Here’s a polished **README.md** you can drop straight into your `chatbot-genai-app` root.  
It’s written to look professional on GitHub, explain the project clearly, and make it easy for anyone to clone, run, and contribute — while keeping your OpenAI key safe.

---

```markdown
# 🤖 Angular + OpenAI Chatbot (chatbot-genai-app)

A full‑stack chatbot application built with **Angular** (frontend) and **Node.js + Express** (backend) in **TypeScript**, integrating with the **OpenAI API** for conversational AI.

The app features:
- 🖥️ **Angular standalone components** with Signals & RxJS for reactive UI
- 🔌 **Secure backend proxy** to OpenAI (API key never exposed to the browser)
- ⚡ Optional **streaming responses** via Server‑Sent Events (SSE)
- 🎨 Simple, responsive chat UI with Shift+Enter for multi‑line input
- 🛡️ Environment‑based configuration & `.env` protection

---

## 📂 Project Structure

```
chatbot-genai-app/
  backend/     # Node.js + Express + TypeScript API server
  frontend/    # Angular 16+ standalone app
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/chatbot-genai-app.git
cd chatbot-genai-app
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
PORT=5050
CORS_ORIGIN=http://localhost:4200
```

> ⚠️ **Never commit `.env`** — it’s in `.gitignore` to keep secrets safe.

Run the backend in dev mode:
```bash
npm run dev
```
The API will be available at `http://localhost:5050`.

---

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Update `src/environments/environment.ts` if needed:
```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5050'
};
```

Run the Angular app:
```bash
npm start
```
The UI will be available at `http://localhost:4200`.

---

## 💬 Usage

1. Type a message in the chat box.
2. Press **Enter** to send, or **Shift+Enter** for a new line.
3. Toggle **Stream** to see token‑by‑token responses.
4. Messages are sent to the backend, which calls the OpenAI API securely.

---

## 🛠 Tech Stack

**Frontend**
- Angular 16+ (standalone components)
- Signals & RxJS
- SCSS styling

**Backend**
- Node.js + Express
- TypeScript
- OpenAI SDK
- dotenv, zod, express‑rate‑limit, cors

---

## 🔒 Security Notes
- API key is stored **only** in the backend `.env`.
- `.env` is ignored by Git to prevent accidental leaks.
- Backend applies basic rate limiting to protect your quota.

---

## 📦 Scripts

**Backend**
```bash
npm run dev     # Start backend in watch mode
npm run build   # Compile TypeScript
npm start       # Run compiled backend
```

**Frontend**
```bash
npm start       # Run Angular dev server
npm run build   # Build for production
```

---

## 🧩 Future Improvements
- Persistent chat history (localStorage or DB)
- Multiple personas / system prompts
- Model & temperature selection in UI
- Authentication for multi‑user scenarios

---

## 📜 License
MIT License — feel free to use, modify, and share.

---

## 🙌 Contributing
Pull requests are welcome!  
For major changes, please open an issue first to discuss what you’d like to change.

---

## 📧 Contact
Created by **Aman** — feel free to connect on [GitHub](https://github.com/<your-username>).
```

---

If you want, I can also **add a diagram** to this README showing the flow:  
**Angular UI → Backend API → OpenAI → Backend → Angular UI** — which makes it even clearer for recruiters or collaborators.  
Do you want me to add that visual architecture section?
