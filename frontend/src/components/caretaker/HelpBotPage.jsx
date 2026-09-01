import { useState } from "react";
import {ArrowLeft,Bot,Send,Sparkles,User,Heart,Lightbulb,MessageCircle,} from "lucide-react";

const starterQuestions = [
  "How can I support someone with memory difficulties?",
  "What should I do if my elder seems confused?",
  "How can I create a better daily routine?",
];

export default function AIHelpbot({ onNavigate }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hello! I'm your Maitri care assistant. I can help you with general caregiving guidance, daily routines, and using the platform.",
    },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = (messageText) => {
    const text = messageText.trim();
    if (!text) return;
    const userMessage = {id: crypto.randomUUID(),sender: "user",text,};
    setMessages((currentMessages) => [...currentMessages,userMessage,]);
    setInput("");
    setTimeout(() => {
      const botMessage = { id: crypto.randomUUID(),sender: "bot",text: getBotResponse(text),};
      setMessages((currentMessages) => [...currentMessages,botMessage,]);
      }, 500);
  };

  const getBotResponse = (text) => {
    const message = text.toLowerCase();
    if (message.includes("medicine") ||message.includes("medication")) 
    {return "For medication-related concerns, you can use the Reminder page to help organize scheduled reminders. Always follow the instructions provided by the elder's healthcare professional for medical decisions.";}

    if (message.includes("confused") ||message.includes("confusion")) 
    {return "Try to stay calm and speak slowly using simple, familiar language. Avoid giving too many instructions at once. A familiar environment and consistent routine can also help reduce confusion.";}

    if (
     message.includes("routine") ||
     message.includes("schedule")
    ) {
      return "A consistent daily routine can be helpful. You can plan regular times for meals, activities, rest, and reminders. Keeping routines simple and familiar is often easier to follow.";
    }

    if (
      message.includes("memory") ||
      message.includes("forget")
    ) {
      return "You can support memory with familiar photos, names, simple conversations, music, and consistent daily routines. Maitri's cognitive activities can also be used as a way to encourage engagement.";
    }

    if (
      message.includes("help") ||
      message.includes("support")
    ) {
      return "I'm here to help with general caregiving guidance, daily routines, reminders, and navigating Maitri. You can ask me about a specific situation as well.";
    }

    return "I understand. For general caregiving, try to keep communication calm, simple, and reassuring. You can also ask me about routines, reminders, memory support, or a specific caregiving situation.";
  };

  return (
    <main className="min-h-screen bg-[#faf8f3] text-[#3f3a34]">
      {/* Header */}
      <header className="border-b border-[#e6e0d6] bg-[#fffdf9]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c9a87] text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <p className="text-lg font-semibold text-[#3f3a34]">
                CODE<span className="text-[#7c9a87]">-1</span>
              </p>

              <p className="text-xs text-[#8a837a]">
                AI Care Assistant
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.("/caretaker")}
            className="flex items-center gap-2 rounded-full border border-[#cfd9ce] bg-[#fffdf9] px-4 py-2 text-sm font-medium text-[#5f7f6a] transition hover:border-[#7c9a87] hover:bg-[#f1f6ef]"
          >
            <ArrowLeft className="h-4 w-4" />
            Caretaker Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero */}
        <div className="rounded-3xl border border-[#e5ded3] bg-gradient-to-br from-[#f6f0e7] via-[#faf7f1] to-[#eef4ec] p-8 shadow-sm sm:p-10">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-[#7c9a87]" />

            <span className="text-sm font-medium uppercase tracking-widest text-[#6f8f7a]">
              Care Support
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-semibold text-[#3f3a34] sm:text-5xl">
            Talk to the AI Helpbot
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#756f67]">
            Get general guidance and support for daily caregiving, routines,
            memory care, and using Maitri.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Chat */}
          <div className="overflow-hidden rounded-3xl border border-[#e4ded4] bg-[#fffdf9] shadow-sm">
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-[#e9e3da] px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c9a87] text-white">
                <Bot className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold text-[#3f3a34]">
                  Maitri Care Assistant
                </p>

                <p className="text-sm text-[#6f8f7a]">
                  Online and ready to help
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[420px] space-y-5 overflow-y-auto bg-[#faf7f1] p-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.sender === "bot" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7c9a87] text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                      message.sender === "user"
                        ? "rounded-br-sm bg-[#7c9a87] text-white"
                        : "rounded-bl-sm border border-[#e5ded3] bg-[#fffdf9] text-[#756f67] shadow-sm"
                    }`}
                  >
                    {message.text}
                  </div>

                  {message.sender === "user" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9e3da] text-[#756f67]">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-3 border-t border-[#e9e3da] bg-[#fffdf9] p-4"
            >
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the care assistant anything..."
                className="flex-1 rounded-xl border border-[#ded7cc] bg-[#faf8f3] px-4 py-3 text-sm text-[#3f3a34] outline-none transition placeholder:text-[#aaa39a] focus:border-[#7c9a87] focus:ring-2 focus:ring-[#dce8dc]"
              />

              <button
                type="submit"
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7c9a87] text-white transition hover:bg-[#668371]"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Side panel */}
          <div className="space-y-5">
            {/* Starter Questions */}
            <div className="rounded-3xl border border-[#e4ded4] bg-[#fffdf9] p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4efe6]">
                <Lightbulb className="h-6 w-6 text-[#8b806f]" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-[#3f3a34]">
                Try asking
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#8a837a]">
                Start with one of these questions.
              </p>

              <div className="mt-5 space-y-3">
                {starterQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => sendMessage(question)}
                    className="w-full rounded-xl border border-[#e4ded4] bg-[#faf8f3] p-4 text-left text-sm text-[#756f67] transition hover:border-[#b8cdbb] hover:bg-[#f1f6ef]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Helping Hand */}
            <div className="rounded-3xl border border-[#dce6d9] bg-gradient-to-br from-[#f1f6ef] to-[#f7f4ed] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fffdf9] text-[#7c9a87]">
                <Heart className="h-5 w-5" />
              </div>

              <h2 className="mt-5 font-semibold text-[#3f3a34]">
                A helping hand
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#756f67]">
                The AI Helpbot provides general caregiving guidance and does
                not replace advice from qualified healthcare professionals.
              </p>
            </div>

            {/* Ask Naturally */}
            <div className="rounded-3xl border border-[#e4ded4] bg-[#fffdf9] p-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-[#7c9a87]" />

                <p className="font-medium text-[#3f3a34]">
                  Ask naturally
                </p>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[#8a837a]">
                You can describe a situation in your own words and get
                simple, easy-to-understand guidance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}