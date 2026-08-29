import { useState } from "react";
import {
  BookOpen,
  Volume2,
  Pause,
  Play,
  Heart,
  Leaf,
  Users,
} from "lucide-react";

import PatientNavigation from "./PatientNavigation";

const STORIES = [
  {
    id: "village-morning",
    title: "A Morning in the Village",
    description:
      "A gentle story about a peaceful morning, familiar surroundings, and everyday village life.",
    category: "Daily Life",
    icon: Leaf,
    background: "#E4F0EC",
  },
  {
    id: "family-gathering",
    title: "A Family Gathering",
    description:
      "A warm story about family, memories, sharing food, and spending time together.",
    category: "Family",
    icon: Users,
    background: "#F3E7D0",
  },
  {
    id: "old-friend",
    title: "Meeting an Old Friend",
    description:
      "A heartwarming story about meeting someone familiar and remembering old times together.",
    category: "Memories",
    icon: Heart,
    background: "#F7E2DF",
  },
  {
    id: "garden",
    title: "The Garden",
    description:
      "A peaceful story about flowers, plants, nature, and taking care of a garden.",
    category: "Nature",
    icon: Leaf,
    background: "#E4F0EC",
  },
];

export default function Story({ onNavigate }) {
  const navigate =
    onNavigate ??
    ((nextPath) => {
      window.location.href = nextPath;
    });

  const [playingStory, setPlayingStory] = useState(null);

  const handleStoryPress = (storyId) => {
    if (playingStory === storyId) {setPlayingStory(null);} 
    else {setPlayingStory(storyId);}
  };

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#20261F] font-sans">
      <PatientNavigation onNavigate={navigate} activePage="stories" />
      <main className="mx-auto mt-8 max-w-6xl px-6 pb-12">
        <section className="rounded-3xl border border-[#E4DCC8] bg-[#F7F3EC] px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2F6F62]">Stories
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Stories</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#5B6459]">Listen to a familiar story and enjoy a quiet moment.</p>
        </section>

        <section className="mt-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {STORIES.map((story) => {
              const Icon = story.icon;
              const isPlaying = playingStory === story.id;

              return (
                <article key={story.id} className="flex flex-col rounded-3xl border-2 border-[#E4DCC8] bg-[#EFEEE6] p-6 shadow-sm">
                  <div className="flex justify-center">
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-[#E4DCC8] text-[#2F6F62]" style={{ background: story.background }}>
                      <Icon className="h-14 w-14" strokeWidth={2} aria-hidden="true" />
                    </div>
                  </div>

                  <div className="mt-5 flex justify-center">
                    <span className="rounded-full bg-[#F3E7D0] px-4 py-2 text-base font-bold text-[#8A4E12]">{story.category}</span>
                  </div>

                  <h2 className="mt-5 text-center text-2xl font-bold sm:text-3xl">{story.title}</h2>
                  <p className="mt-3 text-center text-lg leading-relaxed text-[#5B6459]">{story.description}</p>

                  <button type="button" onClick={() => handleStoryPress(story.id)} className={[ "mt-6 flex w-full items-center justify-center gap-3 rounded-full py-4 text-xl font-bold text-white shadow-sm active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2", isPlaying ? "bg-[#C97A2B]" : "bg-[#2F6F62]", ].join(" ")} aria-pressed={isPlaying} >
                    {isPlaying ? (
                      <>
                        <Pause className="h-6 w-6" aria-hidden="true" />Pause Story
                      </>
                    ) : (
                      <>
                        <Play className="h-6 w-6" aria-hidden="true" />
                        Listen to Story
                      </>
                    )}
                  </button>

                  {isPlaying ? (
                    <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border-2 border-[#E4DCC8] bg-[#F3E7D0] p-4" role="status" aria-live="polite">
                      <Volume2 className="h-6 w-6 text-[#C97A2B]" aria-hidden="true" />
                      <p className="text-lg font-bold">Story is playing</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-3xl rounded-3xl border-2 border-[#E4DCC8] bg-[#F3E7D0] p-6 text-center sm:p-8">
          <BookOpen className="mx-auto h-10 w-10 text-[#2F6F62]" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-bold">Take your time</h2>
          <p className="mt-2 text-lg leading-relaxed text-[#5B6459]"> You can listen to a story whenever you would like. Choose something familiar and enjoy the story at your own pace.</p>
        </section>
      </main>
    </div>
  );
}
