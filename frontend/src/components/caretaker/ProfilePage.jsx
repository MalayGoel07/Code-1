import { useState } from "react";
import {ArrowLeft,User,Mail,Phone,Edit3,Save,X,ShieldCheck,Heart,} from "lucide-react";

export default function ProfilePage({ onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "Caretaker",
    email: "caretaker@example.com",
    phone: "",
    relationship: "Primary Caregiver",
  });

  const [draftProfile, setDraftProfile] = useState(profile);
  const startEditing = () => {setDraftProfile(profile);setIsEditing(true);};
  const cancelEditing = () => {setDraftProfile(profile);setIsEditing(false);};
  const saveProfile = () => {setProfile(draftProfile); setIsEditing(false);};
  const updateDraft = (field, value) => {setDraftProfile((currentProfile) => ({...currentProfile,[field]: value,}));};

  return (
    <main className="min-h-screen bg-[#f8f7f3] text-[#2f3b32]">

      <header className="border-b border-[#e5dfd4] bg-[#fcfbf8]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5f8567] text-white shadow-sm">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#2f3b32]">CODE<span className="text-[#5f8567]">-1</span></p>
              <p className="text-xs text-[#7b837a]">Caretaker Profile</p>
            </div>
          </div>
          <button onClick={() => onNavigate?.("/caretaker")} className="flex items-center gap-2 rounded-full border border-[#cdd8ce] bg-[#fcfbf8] px-4 py-2 text-sm font-medium text-[#5f8567] transition hover:border-[#5f8567] hover:bg-[#edf3ed]">
            <ArrowLeft className="h-4 w-4" />Caretaker Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-3xl border border-[#ded8cc] bg-gradient-to-br from-[#f6f2e8] via-[#f4f1e8] to-[#eaf1e9] p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-[#5f8567]" />
                <span className="text-sm font-medium uppercase tracking-widest text-[#5f8567]">Your account</span>
              </div>
              <h1 className="mt-5 text-4xl font-semibold text-[#2f3b32] sm:text-5xl">Your Profile</h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#6b736b]">Manage your caretaker information and keep your contact detailsup to date.</p>
            </div>

            {!isEditing && (
              <button onClick={startEditing} className="flex items-center justify-center gap-2 rounded-full bg-[#5f8567] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#4f7257]">
                <Edit3 className="h-5 w-5" />Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-[#e1ddd3] bg-[#fcfbf8] shadow-sm">
          <div className="border-b border-[#e5dfd4] bg-[#f5f2eb] px-8 py-7">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#5f8567] text-3xl font-semibold text-white shadow-sm">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#2f3b32]">{profile.name}</h2>
                <p className="mt-1 text-[#7b837a]">{profile.relationship}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-lg font-semibold text-[#2f3b32]">Personal Information</h3>
            <p className="mt-1 text-sm text-[#7b837a]">{isEditing ? "Update your information below.": "Your current caretaker account details."}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4f5a50]"><User className="h-4 w-4 text-[#5f8567]" />Full Name</label>

                {isEditing ? (<input type="text" value={draftProfile.name} onChange={(event) => updateDraft("name", event.target.value) } className="w-full rounded-xl border border-[#ddd8cd] bg-[#fffdfa] px-4 py-3 text-[#2f3b32] outline-none transition focus:border-[#5f8567] focus:ring-2 focus:ring-[#dce8dd]"/>
                ) : (
                <div className="rounded-xl border border-[#e3ded3] bg-[#f7f5ef] px-4 py-3 text-[#4f5a50]">{profile.name}</div>)}
              </div>


              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4f5a50]"><ShieldCheck className="h-4 w-4 text-[#5f8567]" />Role</label>
                {isEditing ? (
                  <select value={draftProfile.relationship} onChange={(event) => updateDraft("relationship", event.target.value) } className="w-full rounded-xl border border-[#ddd8cd] bg-[#fffdfa] px-4 py-3 text-[#2f3b32] outline-none transition focus:border-[#5f8567] focus:ring-2 focus:ring-[#dce8dd]" >
                    <option>Primary Caregiver</option>
                    <option>Family Member</option>
                    <option>Relative</option>
                    <option>Healthcare Assistant</option>
                  </select>
                ) : (
                  <div className="rounded-xl border border-[#e3ded3] bg-[#f7f5ef] px-4 py-3 text-[#4f5a50]">
                    {profile.relationship}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4f5a50]"><Mail className="h-4 w-4 text-[#5f8567]" />Email Address</label>
                {isEditing ? (<input type="email" value={draftProfile.email} onChange={(event) => updateDraft("email", event.target.value) } className="w-full rounded-xl border border-[#ddd8cd] bg-[#fffdfa] px-4 py-3 text-[#2f3b32] outline-none transition focus:border-[#5f8567] focus:ring-2 focus:ring-[#dce8dd]" /> ) : (
                  <div className="rounded-xl border border-[#e3ded3] bg-[#f7f5ef] px-4 py-3 text-[#4f5a50]"> {profile.email}</div>
                )}
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4f5a50]">
                  <Phone className="h-4 w-4 text-[#5f8567]" />
                  Phone Number
                </label>

                {isEditing ? (
                  <input type="tel" value={draftProfile.phone} onChange={(event) => updateDraft("phone", event.target.value) } className="w-full rounded-xl border border-[#ddd8cd] bg-[#fffdfa] px-4 py-3 text-[#2f3b32] outline-none transition focus:border-[#5f8567] focus:ring-2 focus:ring-[#dce8dd]"/>) : (
                  <div className="rounded-xl border border-[#e3ded3] bg-[#f7f5ef] px-4 py-3 text-[#4f5a50]">{profile.phone}</div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex flex-col gap-3 border-t border-[#e5dfd4] pt-6 sm:flex-row">
                <button onClick={saveProfile} className="flex items-center justify-center gap-2 rounded-xl bg-[#5f8567] px-6 py-3 font-medium text-white shadow-sm transition hover:bg-[#4f7257]" ><Save className="h-5 w-5" />Save Changes
                </button>
                <button onClick={cancelEditing} className="flex items-center justify-center gap-2 rounded-xl border border-[#d8d3c8] bg-[#fcfbf8] px-6 py-3 font-medium text-[#5f665d] transition hover:bg-[#f2efe8]" >
                  <X className="h-5 w-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-[#d9e5da] bg-gradient-to-br from-[#eef4ee] to-[#f7f5ef] p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fcfbf8] text-[#5f8567] shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2f3b32]">Your information matters</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b736b]">
                Keeping your caretaker profile up to date helps Maitri provide
                better coordination between you, your family, and your elder's
                care information.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}