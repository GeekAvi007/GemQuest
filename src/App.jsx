import { useEffect, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Client, Databases, ID, Query } from "appwrite";

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Appwrite client configuration
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

export default function App() {
  const { user, isLoaded } = useUser();
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded && user) {
      // Removed fetchChatHistory call since chat history section is removed
    }
  }, [isLoaded, user]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    
    setLoading(true);
    setError(null);

    try {
      // Generate response from Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: input }]
        }]
      });
      const response = await result.response;
      const text = response.text();
      setAnswer(text);

      // Save to Appwrite
      if (user) {
        await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_COLLECTION_ID,
          ID.unique(),
          {
            userId: user.id,
            question: input,
            answer: text,
          },
          [
            `read("user:${user.id}")`,
            `update("user:${user.id}")`,
            `delete("user:${user.id}")`
          ]
        );
      }

      setInput("");
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-900">
      {/* Main content */}
      <main className="flex-1 flex flex-col p-6">
        <SignedOut>
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <h1 className="text-2xl font-bold">GemQuest</h1>
            <SignInButton className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" />
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">GemQuest</h1>
            <UserButton />
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-grow">
              {answer && (
                <div className="border p-4 rounded bg-white mb-4">
                  <h3 className="font-semibold mb-2">Answer:</h3>
                  <div className="whitespace-pre-line">{answer}</div>
                </div>
              )}
              {error && (
                <div className="border p-4 rounded bg-red-50 text-red-600 mb-4">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-auto">
              <textarea
                className="w-full border p-2 rounded"
                rows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
              />
              <button
                onClick={handleSubmit}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                disabled={loading || !input.trim()}
              >
                {loading ? "Generating..." : "Ask GemQuest"}
              </button>
            </div>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}