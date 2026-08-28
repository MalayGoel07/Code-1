import { useState } from "react";
const puzzle = "/puzzle.png";
const diseases = [
      {
        title: "Alzheimer’s Disease",
        content:
          "Alzheimer’s disease is the most common cause of dementia. It is a progressive brain disorder that gradually affects memory, thinking, language, and the ability to perform everyday activities. As the disease progresses, people may experience confusion, difficulty recognizing familiar people or places, and changes in behavior and personality."
      },

      {
        title: "Vascular Dementia",
        content:
          "Vascular dementia occurs when damage to the brain’s blood vessels reduces blood flow and deprives brain cells of oxygen and nutrients. It can develop after a stroke or as a result of long-term conditions affecting blood vessels. Symptoms may include problems with planning, attention, reasoning, memory, movement, and mood."
      },

      {
        title: "Lewy Body Dementia",
        content:
          "Lewy body dementia is associated with abnormal deposits of a protein called alpha-synuclein in the brain. It can cause changes in thinking and attention, visual hallucinations, fluctuations in alertness, sleep problems, and movement symptoms similar to those seen in Parkinson’s disease. Symptoms can vary significantly from day to day."
      },

      {
        title: "Frontotemporal Dementia",
        content:
          "Frontotemporal dementia is a group of disorders that primarily affect the frontal and temporal regions of the brain. Unlike many other forms of dementia, it often begins with changes in personality, behavior, language, or social conduct rather than memory loss. It commonly occurs at a younger age than Alzheimer’s disease."
      },

      {
        title: "Parkinson’s Disease Dementia",
        content:
          "Parkinson’s disease dementia can develop in people who have lived with Parkinson’s disease for some time. It may cause difficulties with attention, memory, reasoning, visual-spatial abilities, and problem-solving. Changes in movement, sleep, mood, and behavior may also occur as the condition progresses."
      },

      {
        title: "Mixed Dementia",
        content:
          "Mixed dementia occurs when a person has brain changes associated with more than one type of dementia. Alzheimer’s disease and vascular dementia are among the most common combinations. Because different conditions can affect the brain at the same time, symptoms may include a mixture of memory problems, reasoning difficulties, movement changes, and behavioral symptoms."
      },

      {
        title: "Huntington’s Disease Dementia",
        content:
          "Huntington’s disease is an inherited neurological disorder that progressively damages nerve cells in the brain. It can cause involuntary movements, changes in mood and behavior, and difficulties with memory, concentration, planning, and decision-making. Dementia may develop as the disease advances."
      },

      {
        title: "Creutzfeldt-Jakob Disease",
        content:
          "Creutzfeldt-Jakob disease is a rare and rapidly progressive brain disorder caused by abnormal proteins called prions. It can lead to rapidly worsening memory and thinking problems, changes in behavior, coordination difficulties, and movement problems. The condition is uncommon but typically progresses much faster than most other forms of dementia."
      },

      {
        title: "Wernicke-Korsakoff Syndrome",
        content:
          "Wernicke-Korsakoff syndrome is a neurological condition associated with severe vitamin B1 (thiamine) deficiency, often related to prolonged heavy alcohol use or other causes of poor nutrition. It can cause serious problems with memory, learning, coordination, and confusion. Early treatment of the underlying deficiency is important."
      },

      {
        title: "Dementia with Down Syndrome",
        content:
          "People with Down syndrome have an increased risk of developing Alzheimer’s disease as they age because of biological changes associated with the condition. Symptoms may include changes in memory, communication, behavior, and daily functioning. Diagnosis can be challenging because some cognitive difficulties may already be present before dementia develops."
      }
    ];
    const symptoms = [
      {
        title: "Memory Loss",
        description:
          "Frequent forgetfulness, such as forgetting recent conversations, appointments, events, or repeatedly asking the same questions."
      },
      {
        title: "Difficulty with Planning",
        description:
          "Trouble organizing tasks, following familiar steps, managing finances, solving problems, or making decisions that were previously easy."
      },
      {
        title: "Confusion with Time & Place",
        description:
          "A person may lose track of dates, seasons, or where they are, and may become confused about familiar places or how they got there."
      },
      {
        title: "Problems with Language",
        description:
          "Difficulty finding the right words, following conversations, naming familiar objects, reading, writing, or expressing thoughts clearly."
      },
      {
        title: "Difficulty Performing Familiar Tasks",
        description:
          "Struggling to complete everyday activities that were once familiar, such as cooking, using household appliances, driving, or managing routine tasks."
      },
      {
        title: "Changes in Judgment",
        description:
          "Reduced ability to make appropriate decisions, which may lead to unusual choices, difficulty handling money, or increased vulnerability to scams."
      },
      {
        title: "Changes in Mood and Personality",
        description:
          "Unusual changes in personality, behavior, or emotions, such as increased anxiety, irritability, apathy, suspicion, fear, or social withdrawal."
      },
      {
        title: "Difficulty with Visual and Spatial Skills",
        description:
          "Problems judging distances, recognizing objects or familiar faces, navigating spaces, reading maps, or coordinating movements."
      },
      {
        title: "Misplacing Things",
        description:
          "Frequently putting objects in unusual places and being unable to retrace steps to find them, sometimes believing that someone else has taken them."
      }
    ];
    const tips = [
      {
        title: "Learn About Dementia",
        description:
          "Learn as much as you can about your diagnosis, symptoms, treatment options, and what to expect. Understanding the condition can help you feel more prepared and confident about managing the future."
      },
      {
        title: "Stay Socially Connected",
        description:
          "Continue spending time with family, friends, and your community. Social interaction can help reduce isolation and support emotional well-being. Try to participate in activities that you enjoy."
      },
      {
        title: "Maintain a Healthy Lifestyle",
        description:
          "Stay physically active, eat a balanced diet, get enough sleep, and avoid smoking and excessive alcohol. Healthy habits can support overall brain and physical health."
      },
      {
        title: "Keep a Daily Routine",
        description:
          "A familiar daily routine can make everyday activities easier and reduce confusion. Use calendars, reminders, labels, or notes to help organize appointments and important tasks."
      },
      {
        title: "Stay Mentally Active",
        description:
          "Keep your mind engaged through activities you enjoy, such as reading, puzzles, music, learning new skills, or talking with others. Choose activities that are enjoyable rather than stressful."
      },
      {
        title: "Plan for the Future",
        description:
          "Talk with trusted family members and healthcare professionals about your future care, finances, legal matters, and personal wishes. Planning early can help you maintain control over important decisions."
      }
    ];
export default function DementiaPage({onNavigate}){
    const [openIndex, setOpenIndex] = useState(null);
    const navigate = onNavigate ?? ((nextPath) => {window.location.href = nextPath;});
    return(
        <div className="theme-page scroll-smooth h-screen overflow-x-hidden overflow-y-auto flex flex-col gap-8" style={{ background: "#FBF8F2", color: "#20261F", fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif" }}>
            <header className="sticky top-0 z-50 border-b backdrop-blur" style={{ borderColor: "#E4DCC8", background: "rgba(255,255,255,0.9)" }}>
              <nav className="mx-auto flex items-center justify-between p-4">
                <div className="text-xl font-semibold tracking-tight text-slate-900">
                  CODE<span style={{ color: "#2F6F62" }}>-1</span>
                </div>
                <div className="flex flex-row gap-2">
                  <a href="#Demnetia" className="rounded-full px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white">Demnetia</a>
                  <a href="#ss" className="rounded-full px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white">Sign and Symptoms</a>
                  <a href="#wtd" className="rounded-full px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white">What to do?</a>
                  <button onClick={() => navigate("/")} className="rounded-full px-5 py-2 text-sm font-bold text-white transition hover:opacity-90" style={{ background: "#2F6F62" }}>← Back</button>
                </div>
              </nav>
            </header>

            <section id="Demnetia" className="scroll-mt-24 mx-auto flex max-w-5xl flex-row items-center justify-center p-8 m-4">
                <div className="p-4">
                    <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl mb-4">What is dementia?</h1>
                    <p className="text-xl text-slate-600">Dementia is a general term (not a specific disease) that describes a group of symptoms which negatively impacts memory severe enough to interfere with daily life.
                        <br></br>Alzheimer’s is the most common form of dementia with 60-80% of cases, while Vascular Dementia is the second most common dementia type. 
                        Nevertheless, there are many other conditions that cause symptoms of dementia. 
                        As opposed to Alzheimer’s, some forms of dementia are reversible. 
                    </p>
                </div>
              <img src={puzzle} alt="Cognitive games screenshot" className="h-80 w-80 shrink-0 rounded-xl border border-blue-900/40 object-cover" />
            </section>

            <section className="mx-auto flex w-full flex-col items-center justify-center gap-16 p-8 mt-4" style={{ background: "#EFEEE6" }}>
                <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl m-4">What are the differnent type of Dementia?</h1>
              {diseases.map((item, index) => (
                <div key={index} className="w-full max-w-4xl border-b border-slate-400 p-4">
                  <div className="flex w-full cursor-pointer flex-row items-center justify-between" onClick={() => setOpenIndex(openIndex === index ? null : index) }  >
                    <span className="text-2xl">{item.title}</span>
                    <span className={`transition-transform duration-300 ${ openIndex === index ? "rotate-180" : "" }`} >⌃</span>
                  </div>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${ openIndex === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}  >
                    <div className="pt-4">{item.content}</div>
                  </div>
                </div>
              ))}
            </section>

            <section id="ss" className="scroll-mt-24 mx-auto flex flex-col max-w-6xl items-center justify-center p-8 mt-4">
                <div className="p-4 flex flex-row mb-4">
                    <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl mb-4">What are the sign and symptoms of Dementia?</h1>
                    <p className="text-2xl text-slate-600 max-w-xl">Remember that Dementia is a general term and not a specific disease like Alzheimer’s. Unlike Alzheimer’s, there aren't 10 specific warning signs you should watch out for. Nevertheless, dementia describes a group of symptoms that impacts your memory severe enough to interfere with your daily life.
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-6 mt-4">
                  {symptoms.map((item, index) => (
                    <div key={index} className="w-full rounded-2xl p-6" style={{ border: "2px solid #E4DCC8", background: "#EFEEE6" }}>
                      <div className="flex flex-col w-full items-center">
                        <span className="text-2xl font-semibold">{item.title}</span>
                        <p className="pt-4 text-center text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
            </section>

            <section id="wtd" className="scroll-mt-24 mx-auto flex w-full flex-col items-center justify-center p-8 mt-4" style={{ background: "#EFEEE6" }}>
                <div className="p-4 flex flex-col items-center mb-4 max-w-4xl mb-4">
                    <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl mb-4">What do I do if I have been diagnosed with Dementia?</h1>
                    <p className="text-2xl text-slate-600"> A dementia diagnosis doesn’t mean that you can’t live life to the fullest. To do that, it’s important that you find a healthy way to deal with your emotions and face your diagnosis. It’s important to not isolate yourself, but include yourself in social activities. The following tips may be helpful for you if you have been diagnosed with dementia or Alzheimer’s :
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-6 mt-4 rounded-2xl max-w-6xl" style={{ border: "2px solid #E4DCC8", background: "#FFFFFF" }}>
                  {tips.map((item, index) => (
                    <div key={index} className="w-full p-6">
                      <div className="flex flex-col w-full items-center">
                        <span className="text-2xl font-semibold">{item.title}</span>
                        <p className="pt-4 text-center text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
            </section>

            <section className="px-6 py-8">
              <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl border p-10 sm:flex-row sm:items-center" style={{ borderColor: "#E4DCC8", background: "#F3E7D0" }}>
                <div>
                  <h3 className="text-2xl font-semibold">Stay connected..</h3>
                  <p className="mt-2" style={{ color: "#5B6459" }}>Create an account to set up a patient profile and invite your family circle.</p>
                </div>
                <button onClick={() => navigate("/logsign")} className="shrink-0 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">Log In / Sign Up </button>
              </div>
            </section>

            <footer className="border-t border-slate-200 px-6 py-8">
              <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-sm text-slate-500 sm:flex-row">
                <span className="text-slate-700"> CODE-1</span>
                <div className="flex flex-col items-end">
                  <span>Smart India Hackathon 2026 · Problem Statement - 26003</span>
                  <span>· Bennett University 2025-29</span>
                  <span>· Team Code-1</span>
                </div>
              </div>
            </footer>
        </div>
    )
}