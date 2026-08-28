import { useState } from "react";
import {
  Mic,
  Send,
  Bot,
  UserRound,
  Volume2,
} from "lucide-react";

import PatientNavigation from "./PatientNavigation";

const VOICE_COPY = {
  idle: {
    label: "Tap to speak",
    support: "You can talk to your companion.",
  },
  listening: {
    label: "Listening...",
    support: "Tell me what you would like to talk about.",
  },
  processing: {
    label: "Understanding...",
    support: "Please wait.",
  },
  not_understood: {
    label: "I didn't understand that.",
    support: "Please try again.",
  },
};

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: "ai",
    text: "Hello! I am your companion. How are you feeling today?",
  },
];

export default function ElderAi({ onNavigate }) {
  const navigate =
    onNavigate ??
    ((nextPath) => {
      window.location.href = nextPath;
    });

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [message, setMessage] = useState("");
  const [voiceState, setVoiceState] = useState("idle");

  const voiceCopy = VOICE_COPY[voiceState];

  const handleVoicePress = () => {
    if (voiceState === "idle") {
      setVoiceState("listening");
      return;
    }

    if (voiceState === "listening") {
      setVoiceState("processing");

      setTimeout(() => {
        setVoiceState("not_understood");
      }, 1000);

      return;
    }

    if (voiceState === "processing") {
      return;
    }

    setVoiceState("idle");
  };

  const handleSendMessage = (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const newUserMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmedMessage,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      newUserMessage,
    ]);

    setMessage("");

    // Frontend placeholder.
    // Later this will connect to the AI backend.

    setTimeout(() => {
      const aiReply = {
        id: Date.now() + 1,
        sender: "ai",
        text: "Thank you for telling me. I am here to listen.",
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        aiReply,
      ]);
    }, 700);
  };

  return (
    <div
      className="theme-page min-h-screen pb-16"
      style={{
        background: "#FBF8F2",
        color: "#20261F",
        fontFamily:
          "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Patient Navigation */}
      <PatientNavigation
        onNavigate={navigate}
        activePage="talk"
      />

      {/* Voice Assistant */}
      <div className="mt-8 flex flex-col items-center px-6">
        <button
          type="button"
          onClick={handleVoicePress}
          aria-label={voiceCopy.label}
          aria-pressed={voiceState !== "idle"}
          className="flex items-center justify-center rounded-full border-4 shadow-md active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
          style={{
            width: "80px",
            height: "80px",
            background:
              voiceState === "listening"
                ? "#F3E7D0"
                : "#2F6F62",
            borderColor:
              voiceState === "listening"
                ? "#C97A2B"
                : "#24594F",
            color:
              voiceState === "listening"
                ? "#2F6F62"
                : "#FFFFFF",
          }}
        >
          <Mic
            className={`h-10 w-10 ${
              voiceState === "listening"
                ? "motion-safe:animate-pulse motion-reduce:animate-none"
                : ""
            }`}
            aria-hidden="true"
          />
        </button>

        <p
          className="mt-3 text-lg font-bold"
          aria-live="polite"
        >
          {voiceCopy.label}
        </p>

        <p
          className="mt-1 text-center text-base"
          style={{ color: "#5B6459" }}
        >
          {voiceCopy.support}
        </p>

        {voiceState === "not_understood" ? (
          <button
            type="button"
            onClick={() => setVoiceState("idle")}
            className="mt-3 rounded-full px-6 py-3 text-lg font-bold text-white active:scale-95"
            style={{
              background: "#2F6F62",
            }}
          >
            Try Again
          </button>
        ) : null}
      </div>

      {/* Main Content */}
      <main className="mx-auto mt-8 max-w-3xl px-6">

        {/* Heading */}
        <section className="text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Talk to Your Companion
          </h1>

          <p
            className="mx-auto mt-3 max-w-2xl text-xl"
            style={{ color: "#5B6459" }}
          >
            You can talk to me, ask a question, or simply
            tell me about your day.
          </p>
        </section>

        {/* Chat Area */}
        <section
          className="mt-8 rounded-3xl p-5 sm:p-6"
          style={{
            background: "#EFEEE6",
            border: "2px solid #E4DCC8",
          }}
          aria-label="Conversation with your companion"
        >
          <div className="space-y-5">

            {messages.map((chatMessage) => {
              const isUser =
                chatMessage.sender === "user";

              return (
                <div
                  key={chatMessage.id}
                  className={`flex items-start gap-3 ${
                    isUser
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  {!isUser ? (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: "#2F6F62",
                        color: "#FFFFFF",
                      }}
                    >
                      <Bot
                        className="h-7 w-7"
                        aria-hidden="true"
                      />
                    </div>
                  ) : null}

                  <div
                    className="max-w-[80%] rounded-3xl px-5 py-4"
                    style={{
                      background: isUser
                        ? "#2F6F62"
                        : "#FFFFFF",
                      color: isUser
                        ? "#FFFFFF"
                        : "#20261F",
                      border: isUser
                        ? "2px solid #24594F"
                        : "2px solid #E4DCC8",
                    }}
                  >
                    <p className="text-lg leading-relaxed">
                      {chatMessage.text}
                    </p>
                  </div>

                  {isUser ? (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: "#F3E7D0",
                        color: "#8A4E12",
                        border:
                          "2px solid #C97A2B",
                      }}
                    >
                      <UserRound
                        className="h-7 w-7"
                        aria-hidden="true"
                      />
                    </div>
                  ) : null}

                </div>
              );
            })}

          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <label
              htmlFor="companion-message"
              className="sr-only"
            >
              Type a message to your companion
            </label>

            <input
              id="companion-message"
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Type what you want to say..."
              className="min-h-14 flex-1 rounded-full border-2 px-5 text-lg outline-none focus:ring-4 focus:ring-[#2F6F62]/20"
              style={{
                background: "#FFFFFF",
                borderColor: "#C9C2B2",
                color: "#20261F",
              }}
            />

            <button
              type="submit"
              className="flex min-h-14 items-center justify-center gap-2 rounded-full px-7 text-lg font-bold text-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2"
              style={{
                background: "#2F6F62",
              }}
            >
              <Send
                className="h-6 w-6"
                aria-hidden="true"
              />
              Send
            </button>
          </form>
        </section>

        {/* Suggested Topics */}
        <section className="mt-8">

          <h2 className="text-center text-2xl font-bold">
            You can talk about
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

            <button
              type="button"
              onClick={() =>
                setMessage("Tell me a story.")
              }
              className="rounded-2xl p-5 text-left text-lg font-bold active:scale-95"
              style={{
                background: "#FFFFFF",
                border: "2px solid #E4DCC8",
              }}
            >
              📖 Tell me a story
            </button>

            <button
              type="button"
              onClick={() =>
                setMessage("How is my day going?")
              }
              className="rounded-2xl p-5 text-left text-lg font-bold active:scale-95"
              style={{
                background: "#FFFFFF",
                border: "2px solid #E4DCC8",
              }}
            >
              ☀️ Talk about my day
            </button>

            <button
              type="button"
              onClick={() =>
                setMessage("Tell me something interesting.")
              }
              className="rounded-2xl p-5 text-left text-lg font-bold active:scale-95"
              style={{
                background: "#FFFFFF",
                border: "2px solid #E4DCC8",
              }}
            >
              💡 Tell me something interesting
            </button>

            <button
              type="button"
              onClick={() =>
                setMessage("I want some company.")
              }
              className="rounded-2xl p-5 text-left text-lg font-bold active:scale-95"
              style={{
                background: "#FFFFFF",
                border: "2px solid #E4DCC8",
              }}
            >
              ❤️ I want some company
            </button>

          </div>
        </section>

        {/* Voice Information */}
        <section
          className="mt-8 flex items-center gap-4 rounded-3xl p-5"
          style={{
            background: "#F3E7D0",
            border: "2px solid #E4DCC8",
          }}
        >
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "#FFFFFF",
              color: "#2F6F62",
            }}
          >
            <Volume2
              className="h-7 w-7"
              aria-hidden="true"
            />
          </div>

          <p
            className="text-lg font-semibold"
            style={{ color: "#5B6459" }}
          >
            You can use your voice button whenever you
            would rather speak than type.
          </p>
        </section>

      </main>
    </div>
  );
}