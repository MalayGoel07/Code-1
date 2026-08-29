import { useState } from "react";
import {
  Mic,
  UserRound,
  Pencil,
  CalendarDays,
  Languages,
  Heart,
  Gamepad2,
  BookOpen,
  Bell,
  ShieldCheck,
  UsersRound,
  Check,
} from "lucide-react";

import PatientNavigation from "./PatientNavigation";

const VOICE_COPY = {
  idle: {
    label: "Tap to speak",
    support: "",
  },
  listening: {
    label: "Listening...",
    support: "Tell me what you would like to do.",
  },
  processing: {
    label: "Understanding...",
    support: "",
  },
  not_understood: {
    label: "I didn't understand that.",
    support: "Please try again.",
  },
};

export default function Profile({ onNavigate }) {
  const navigate =
    onNavigate ??
    ((nextPath) => {
      window.location.href = nextPath;
    });

  const [voiceState, setVoiceState] = useState("idle");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ name: "Kong", age: "72", language: "English", caregiver: "Family Caregiver",});
  const voiceCopy = VOICE_COPY[voiceState];
  const handleVoicePress = () => {
    if (voiceState === "idle") {setVoiceState("listening");return;}
    if (voiceState === "listening") {setVoiceState("processing");
      setTimeout(() => {setVoiceState("not_understood");}, 1000);
      return;
    }
    if (voiceState === "processing") {return; }
    if (voiceState === "not_understood") {setVoiceState("idle"); }
  };

  const handleProfileChange = (field, value) => {setProfile((currentProfile) => ({...currentProfile, [field]: value,}));};
  return (
    <div  className="theme-page min-h-screen pb-16"  style={{ background: "#FBF8F2", color: "#20261F", fontFamily: "Verdana, Tahoma, 'Segoe UI', system-ui, sans-serif",}}>
      <PatientNavigation onNavigate={navigate} activePage="profile"/>

      <div className="mt-8 flex flex-col items-center px-6">
        <button type="button" onClick={handleVoicePress} aria-label={voiceCopy.label} aria-pressed={voiceState !== "idle"} className="flex items-center justify-center rounded-full border-4 shadow-md active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2" style={{ width: "76px", height: "76px", background: voiceState === "listening"  ? "#F3E7D0"  : "#2F6F62", borderColor:   voiceState === "listening"     ? "#C97A2B"     : "#24594F", color: voiceState === "listening"  ? "#2F6F62"  : "#FFFFFF", }}>
          <Mic className={`h-9 w-9 ${ voiceState === "listening"  ? "motion-safe:animate-pulse motion-reduce:animate-none"  : "" }`} aria-hidden="true" />
        </button>
        <p className="mt-3 text-center text-lg font-bold" aria-live="polite"> {voiceCopy.label}</p>
        {voiceCopy.support ? (
          <p className="mt-1 max-w-sm text-center text-base" style={{ color: "#5B6459" }}> {voiceCopy.support}</p>
        ) : null}

        {voiceState === "not_understood" ? (
          <button type="button" onClick={() => setVoiceState("idle")} className="mt-4 rounded-full px-6 py-3 text-lg font-bold text-white active:scale-95" style={{   background: "#2F6F62", }}>  Try Again</button>
        ) : null}
      </div>

      <main className="mx-auto mt-10 max-w-5xl px-6">
        <section className="text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">My Profile </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xl" style={{ color: "#5B6459" }}> Your personal information and activity.</p>
        </section>


        <section className="mx-auto mt-8 max-w-3xl rounded-3xl p-6 sm:p-8" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }} >
          <div className="flex flex-col items-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full" style={{ background: "#F3E7D0", border: "4px solid #2F6F62", color: "#2F6F62", }}>
              <UserRound className="h-16 w-16" aria-hidden="true" />
            </div> 
            <h2 className="mt-5 text-3xl font-bold">{profile.name}</h2>
            <p className="mt-1 text-lg" style={{ color: "#5B6459" }}>Patient</p>
          </div>

          <button type="button" onClick={() => setIsEditing(!isEditing) } className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-full px-7 py-3 text-lg font-bold active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2F6F62] focus-visible:ring-offset-2" style={{ background: isEditing ? "#FFFFFF" : "#2F6F62", color: isEditing   ? "#2F6F62"   : "#FFFFFF", border: isEditing   ? "2px solid #2F6F62"   : "2px solid #2F6F62", }}>
            {isEditing ? (
              <><Check className="h-5 w-5" aria-hidden="true"/>Done Editing</>
            ) : (
              <> <Pencil className="h-5 w-5" aria-hidden="true"/>Edit Profile</>
            )}
          </button>
        </section>

        <section className="mx-auto mt-8 max-w-3xl">
          <h2 className="mb-5 text-2xl font-bold">Personal Information</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }} >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ bckground: "#F3E7D0", color: "#8A4E12", }}>
                  <UserRound className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold" style={{ color: "#5B6459" }}>  Name</p>
                  {isEditing ? (
                    <input type="text" value={profile.name} onChange={(event) => handleProfileChange( "name", event.target.value ) } className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 text-lg font-bold outline-none focus:ring-4 focus:ring-[#2F6F62]/20" style={{   borderColor: "#C9C2B2", }}/>
                  ) : (
                    <p className="mt-1 text-xl font-bold">{profile.name}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "#E4F0EC", color: "#2F6F62", }}>
                  <CalendarDays className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold" style={{ color: "#5B6459" }} >Age</p>
                  {isEditing ? (
                    <input type="number" value={profile.age} onChange={(event) => handleProfileChange( "age", event.target.value ) } className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 text-lg font-bold outline-none focus:ring-4 focus:ring-[#2F6F62]/20" style={{   borderColor: "#C9C2B2", }}/>
                  ) : (
                    <p className="mt-1 text-xl font-bold">{profile.age} years</p>
                  )}
                </div>

              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{background: "#F3E7D0",color: "#8A4E12", }}>
                  <Languages className="h-7 w-7" aria-hidden="true"/>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold" style={{ color: "#5B6459" }}>Preferred Language</p>
                  {isEditing ? (
                    <select value={profile.language} onChange={(event) => handleProfileChange( "language", event.target.value ) } className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 text-lg font-bold outline-none focus:ring-4 focus:ring-[#2F6F62]/20" style={{   borderColor: "#C9C2B2", }}>
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Assamese</option>
                      <option>Bengali</option>
                      <option>Manipuri</option>
                      <option>Mizo</option>
                      <option>Khasi</option>
                      <option>Garo</option>
                      <option>Tripuri</option>
                      <option>Nepali</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-xl font-bold">{profile.language}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-5" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "#F7E2DF", color: "#B23A3A", }}>
                  <UsersRound className="h-7 w-7" aria-hidden="true"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold" style={{ color: "#5B6459" }}>Caregiver</p>
                  {isEditing ? (
                    <input type="text" value={profile.caregiver} onChange={(event) => handleProfileChange( "caregiver",  event.target.value ) } className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 text-lg font-bold outline-none focus:ring-4 focus:ring-[#2F6F62]/20" style={{   borderColor: "#C9C2B2", }}/>
                  ) : (<p className="mt-1 text-xl font-bold">{profile.caregiver}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-3xl">
          <h2 className="mb-5 text-2xl font-bold"> My Activity</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-3xl p-6 text-center" style={{background: "#E4F0EC", border: "2px solid #2F6F62",}} >
              <Gamepad2 className="mx-auto h-10 w-10" style={{ color: "#2F6F62" }} aria-hidden="true"/>
              <p className="mt-3 text-3xl font-bold">0</p>
              <p className="mt-1 text-lg font-bold" style={{ color: "#5B6459" }}>  Games Completed</p>
            </div>
            <div className="rounded-3xl p-6 text-center" style={{ background: "#F3E7D0", border: "2px solid #C97A2B", }}>
              <BookOpen className="mx-auto h-10 w-10" style={{ color: "#C97A2B" }} aria-hidden="true"/>
              <p className="mt-3 text-3xl font-bold">0</p>
              <p className="mt-1 text-lg font-bold" style={{ color: "#5B6459" }} > Stories Listened </p>
            </div>

            <div className="rounded-3xl p-6 text-center" style={{ background: "#F7E2DF", border: "2px solid #B23A3A", }}>
              <Bell className="mx-auto h-10 w-10" style={{ color: "#B23A3A" }} aria-hidden="true" />
              <p className="mt-3 text-3xl font-bold">0</p>
              <p className="mt-1 text-lg font-bold" style={{ color: "#5B6459" }}>Tasks Completed</p>
            </div>
          </div>
        </section>


        <section className="mx-auto mt-10 max-w-3xl rounded-3xl p-6 sm:p-8" style={{ background: "#EFEEE6", border: "2px solid #E4DCC8", }}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: "#E4F0EC", color: "#2F6F62", }}>
              <ShieldCheck className="h-7 w-7" aria-hidden="true"/>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Your Information</h2>
              <p className="mt-2 text-lg leading-relaxed" style={{ color: "#5B6459" }} >
                Your personal information and activity
                data are kept private and are used to
                support your care.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-3xl rounded-3xl p-6 text-center" style={{ background: "#F3E7D0", border: "2px solid #E4DCC8", }}>
          <Heart className="mx-auto h-10 w-10" style={{ color: "#B23A3A" }} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-bold">Keep taking care of yourself</h2>
          <p className="mt-2 text-lg" style={{ color: "#5B6459" }} >
            Every small activity is a step towards a
            happier and healthier day.
          </p>
        </section>
      </main>
    </div>
  );
}