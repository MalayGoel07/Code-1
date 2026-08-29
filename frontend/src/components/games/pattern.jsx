import { useEffect, useMemo, useState } from "react";

const SHAPE_TYPES = [
  { type: "triangle", label: "Triangle" },
  { type: "square", label: "Square" },
  { type: "circle", label: "Circle" },
  { type: "rectangle", label: "Rectangle" },
];

const shuffle = (items) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]];}
  return array;
};

const getShapeStyles = (type, isSmall = false) => {
  const size = isSmall ? 52 : 76;
  const common = {
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid #2F6F62",
    background: "#FFFFFF",
    boxShadow: "0 10px 20px rgba(47, 111, 98, 0.08)",
    position: "relative",
  };

  if (type === "circle") {return {...common,borderRadius: "50%",background: "#F2DFA4",}; }
  if (type === "square") {return {...common,borderRadius: "18%",background: "#D9E8CF",};}
  if (type === "rectangle") {return {...common,borderRadius: "12%",width: size + 18,height: size - 12,background: "#E6D5F7",};}
  return {...common,width: 0,height: 0,borderLeft: `${size / 2}px solid transparent`,borderRight: `${size / 2}px solid transparent`,borderBottom: `${size}px solid #F7B8A6`,background: "transparent",boxShadow: "none",};
};

function ShapeCard({ type, label, isSmall = false, active = false, onHover }) {
  const shapeStyle = getShapeStyles(type, isSmall);
  return (
    <button type="button" onMouseEnter={() => onHover?.(type)} onFocus={() => onHover?.(type)} style={{ border: active ? "3px solid #2F6F62" : "2px solid #E4DCC8", background: active ? "#F2F8F6" : "#F7F3EC", borderRadius: "22px", padding: "18px 16px", minWidth: "120px", minHeight: "120px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", cursor: "pointer", transition: "all 0.2s ease", boxShadow: active ? "0 12px 25px rgba(47,111,98,0.1)" : "0 8px 18px rgba(32,38,31,0.04)",  }}  aria-label={label}>
      <div style={{ ...shapeStyle, transform: type === "triangle" ? "translateY(12px)" : "none", filter: active ? "drop-shadow(0 8px 16px rgba(47,111,98,0.18))" : "none", }}  />
      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#20261F" }}>{label}</span>
    </button>
  );
}

export default function PatternGame({ onNavigate }) {
  const navigate = onNavigate ?? ((nextPath) => { window.location.href = nextPath; });
  const arranged = useMemo(() => SHAPE_TYPES, []);
  const [mixedShapes, setMixedShapes] = useState(() => shuffle(SHAPE_TYPES));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matched, setMatched] = useState([]);
  const [message, setMessage] = useState("Hover the matching shape under the pattern above.");
  const [mistake, setMistake] = useState(false);
  const [gameRecorded, setGameRecorded] = useState(false);
  const activeShape = arranged[currentIndex];

  const recordGameCompletion = async () => {
    const token = localStorage.getItem("access_token");
    if (!token || gameRecorded) {
      return;
    }

    try {
      await fetch("http://localhost:8000/patient/game-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          game_id: "pattern-game",
          game_name: "Pattern Match",
        }),
      });
      setGameRecorded(true);
    } catch (error) {
      console.error("Failed to save game completion:", error);
    }
  };

  useEffect(() => {
    if (currentIndex >= arranged.length) {
      recordGameCompletion();
    }
  }, [currentIndex, arranged.length]);
  const handleHover = (type) => {
    if (matched.includes(type)) {return;}
    if (type === activeShape.type) {
      const nextMatched = [...matched, type];
      setMatched(nextMatched);
      setMistake(false);
      if (currentIndex === arranged.length - 1) {
        setMessage("Excellent! You matched every shape.");
        setCurrentIndex(arranged.length);
        return;
      }
      setMessage(`Nice! ${activeShape.label} matched. Now find the next one.`);
      setCurrentIndex((prev) => prev + 1);
      setMixedShapes((prev) => shuffle(prev.filter((shape) => shape.type !== type)));
      return;
    }

    setMistake(true);
    setMessage(`Not quite. Try the ${activeShape.label.toLowerCase()} shape.`);
  };

  const resetGame = () => {
    setGameRecorded(false);
    setCurrentIndex(0);
    setMatched([]);
    setMistake(false);
    setMixedShapes(shuffle(SHAPE_TYPES));
    setMessage("Hover the matching shape under the pattern above.");
  };

  if (currentIndex >= arranged.length) {
    return (
      <div style={{ minHeight: "100vh", background: "#FBF8F2", padding: "32px 20px", display: "grid", placeItems: "center" }}>
        <div style={{ maxWidth: "620px", width: "100%", background: "#F7F3EC", border: "2px solid #E4DCC8", borderRadius: "30px", padding: "32px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <button
              type="button"
              onClick={() => navigate("/homepage")}
              style={{
                background: "#FFFFFF",
                border: "2px solid #C9C2B2",
                borderRadius: "999px",
                padding: "10px 16px",
                fontWeight: 700,
                cursor: "pointer",
                color: "#20261F",
              }}
            >
              ← Back
            </button>
            <div style={{ flex: 1 }} />
          </div>
          <p style={{ margin: 0, color: "#2F6F62", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.8rem" }}>Pattern Game</p>
          <h2 style={{ margin: "16px 0 10px", fontSize: "2.3rem", color: "#20261F" }}>You did it!</h2>
          <p style={{ margin: "0 0 24px", fontSize: "1.06rem", lineHeight: 1.6, color: "#5B6459" }}>
            You matched all four shapes in the correct pattern.
          </p>
          <button type="button" onClick={resetGame} style={{ background: "#2F6F62", color: "#FFFFFF", border: "none", borderRadius: "999px", padding: "14px 24px", fontSize: "1rem", fontWeight: 700, cursor: "pointer",}}  > Play Again  </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FBF8F2", padding: "32px 20px", color: "#20261F", fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px", gap: "14px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/homepage")}
              style={{
                background: "#FFFFFF",
                border: "2px solid #C9C2B2",
                borderRadius: "999px",
                padding: "10px 16px",
                fontWeight: 700,
                cursor: "pointer",
                color: "#20261F",
              }}
            >
              ← Back
            </button>
            <div>
              <p style={{ margin: 0, color: "#2F6F62", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.78rem" }}>Pattern Match</p>
              <h1 style={{ margin: "10px 0 0", fontSize: "2.2rem" }}>Find the missing shape</h1>
            </div>
          </div>
          <button type="button" onClick={resetGame} style={{ background: "#FFFFFF", border: "2px solid #C9C2B2", borderRadius: "999px", padding: "10px 16px", fontWeight: 700, cursor: "pointer", color: "#20261F",}}  >    Reset  </button>
        </div>

        <div style={{ background: "#F7F3EC", border: "2px solid #E4DCC8", borderRadius: "30px", padding: "28px 20px 22px", boxShadow: "0 18px 35px rgba(32,38,31,0.05)",  }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap", marginBottom: "30px" }}>
            {arranged.map((shape, index) => {
              const isActive = index === currentIndex;
              const isDone = matched.includes(shape.type);

              return (
                <div key={shape.type} style={{ textAlign: "center" }}>
                  <ShapeCard type={shape.type} label={shape.label} active={isActive || isDone} onHover={() => {}}  />
                  <div style={{ marginTop: "8px", fontSize: "0.8rem", fontWeight: 700, color: isActive ? "#2F6F62" : "#5B6459" }}>
                    {isDone ? "Matched" : `Pattern ${index + 1}`}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ margin: "0 auto 18px", maxWidth: "760px", padding: "12px 18px", borderRadius: "16px", background: mistake ? "#FDECEC" : "#EEF7F4", border: mistake ? "2px solid #E9B4B4" : "2px solid #C5DDD8", color: mistake ? "#9B3F3F" : "#2F6F62", fontWeight: 700, textAlign: "center" }}>{message}</div>

          <div style={{ display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap" }}>
            {mixedShapes.map((shape) => (
              <ShapeCard key={`${shape.type}-${shape.label}`} type={shape.type} label={shape.label} isSmall active={matched.includes(shape.type)} onHover={handleHover}  />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
