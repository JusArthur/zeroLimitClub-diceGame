/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import HistoryRecord from "./HistoryRecord";

// 牛牛游戏组件
const NiuNiuGame = ({ onBack }) => {
  const [cards, setCards] = useState([
    { suit: "♠", rank: "?" },
    { suit: "♥", rank: "?" },
    { suit: "♦", rank: "?" },
    { suit: "♣", rank: "?" },
    { suit: "♠", rank: "?" }
  ]);
  const [isRolling, setIsRolling] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [revealedCards, setRevealedCards] = useState([false, false, false, false, false]);

  const suitColors = {
    "♠": "#000",
    "♥": "#dc2626",
    "♦": "#dc2626",
    "♣": "#000",
    "?": "#6b7280"
  };

  const saveToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("保存失败:", e);
    }
  };

  const getFromStorage = (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error("读取失败:", e);
      return null;
    }
  };

  useEffect(() => {
    const saved = getFromStorage("niuNiuHistory");
    if (saved) {
      setHistory(saved);
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      saveToStorage("niuNiuHistory", history);
    }
  }, [history]);

  const rollCards = async () => {
    if (isRolling) return;

    setIsRolling(true);
    setGameResult(null);
    setRevealedCards([false, false, false, false, false]);

    try {
      // 1. Fetch the secure result from the Go backend
      const response = await fetch('/.netlify/functions/rollNiuNiu', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const secureData = await response.json();
      const finalCards = secureData.cards;
      const result = secureData.result;

      // 2. Set the cards into state (they won't be visible yet due to revealedCards state)
      setCards(finalCards);

      // 3. Play the animation sequence
      const fastInterval = 500;
      const slowInterval = 1000;
      
      finalCards.forEach((_, index) => {
        const delay = index < 3
            ? fastInterval * (index + 1)
            : fastInterval * 3 + slowInterval * (index - 2);
            
        setTimeout(() => {
          setRevealedCards((prev) => {
            const newRevealed = [...prev];
            newRevealed[index] = true;
            return newRevealed;
          });

          if (index === finalCards.length - 1) {
            setTimeout(() => {
              setGameResult(result);
              setHistory((prev) => [
                ...prev,
                {
                  cards: finalCards,
                  result,
                  time: new Date().toLocaleString(),
                },
              ]);
              setIsRolling(false);
            }, fastInterval);
          }
        }, delay);
      });

    } catch (error) {
      console.error("Failed to fetch secure roll:", error);
      alert("服务器连接失败，请重试。");
      setIsRolling(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          ← 返回
        </button>

        <h1 style={styles.title}>🃏 牛牛游戏</h1>
        <div style={styles.spacer}></div>
      </div>

      <div style={styles.gameArea}>
        <div style={styles.cardsContainer}>
          {cards.map((card, index) => (
            <div
              key={index}
              style={{
                ...styles.card,
                ...(isRolling && !revealedCards[index]
                  ? styles.cardRolling
                  : {}),
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div style={{ ...styles.cardSuit, color: suitColors[card.suit] }}>
                {!isRolling || revealedCards[index] ? card.suit : "?"}
              </div>
              <div style={{ ...styles.cardRank, color: suitColors[card.suit] }}>
                {!isRolling || revealedCards[index] ? card.rank : "?"}
              </div>
            </div>
          ))}
        </div>

        {!isRolling && gameResult && (
          <div style={{ ...styles.resultBox, borderColor: gameResult.color }}>
            <h2 style={{ ...styles.resultName, color: gameResult.color }}>
              {gameResult.name}
            </h2>
            <div style={styles.resultDetails}>
              <span style={styles.multiplier}>{gameResult.multiplier}</span>
            </div>
            <p style={styles.description}>{gameResult.description}</p>
          </div>
        )}

        <div style={styles.buttonContainer}>
          <button
            onClick={rollCards}
            disabled={isRolling}
            style={{
              ...styles.rollBtn,
              ...(isRolling ? styles.rollBtnDisabled : {}),
            }}
          >
            {isRolling ? "发牌中... 🎴" : "发牌 🎴"}
          </button>
        </div>

        {isRolling && <div style={styles.rollingStatus}>买定离手...</div>}
      </div>
      <HistoryRecord history={history} styles={styles} />
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
    padding: "clamp(10px, 3vw, 20px)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "clamp(15px, 4vw, 30px)",
    gap: "10px",
  },
  backBtn: {
    padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 20px)",
    fontSize: "clamp(14px, 3.5vw, 16px)",
    backgroundColor: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s",
    whiteSpace: "nowrap",
  },
  title: {
    fontSize: "clamp(20px, 5vw, 28px)",
    color: "#fff",
    margin: 0,
    textAlign: "center",
    flex: 1,
  },
  spacer: {
    width: "clamp(60px, 15vw, 100px)",
  },
  gameArea: {
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
  },
  cardsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "clamp(5px, 1.5vw, 15px)",
    flexWrap: "wrap",
    marginBottom: "clamp(20px, 4vw, 30px)",
    minHeight: "clamp(120px, 25vw, 180px)",
  },
  card: {
    width: "clamp(60px, 16vw, 120px)",
    height: "clamp(85px, 22vw, 170px)",
    backgroundColor: "#fff",
    borderRadius: "clamp(6px, 1.5vw, 12px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "transform 0.3s",
  },
  cardRolling: {
    animation: "cardFlip 0.5s ease-in-out infinite",
  },
  cardSuit: {
    fontSize: "clamp(20px, 6.5vw, 40px)",
    fontWeight: "bold",
    marginBottom: "clamp(2px, 1vw, 8px)",
  },
  cardRank: {
    fontSize: "clamp(16px, 5vw, 32px)",
    fontWeight: "bold",
  },
  resultBox: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: "clamp(12px, 3vw, 16px)",
    padding: "clamp(15px, 4vw, 25px)",
    margin: "clamp(20px, 4vw, 30px) auto",
    maxWidth: "500px",
    border: "3px solid",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  },
  resultName: {
    fontSize: "clamp(24px, 6vw, 32px)",
    fontWeight: "bold",
    margin: "0 0 clamp(10px, 2vw, 15px) 0",
  },
  resultDetails: {
    display: "flex",
    justifyContent: "center",
    gap: "clamp(15px, 3vw, 20px)",
    marginBottom: "clamp(10px, 2vw, 15px)",
    flexWrap: "wrap",
  },
  multiplier: {
    fontSize: "clamp(18px, 4.5vw, 24px)",
    fontWeight: "bold",
    color: "#059669",
    backgroundColor: "#d1fae5",
    padding: "clamp(4px, 1vw, 5px) clamp(12px, 3vw, 15px)",
    borderRadius: "20px",
  },
  description: {
    fontSize: "clamp(14px, 3.5vw, 18px)",
    color: "#4b5563",
    margin: 0,
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "clamp(15px, 3vw, 20px)",
    marginTop: "clamp(15px, 3vw, 20px)",
    flexWrap: "wrap",
  },
  rollBtn: {
    padding: "clamp(12px, 3vw, 18px) clamp(30px, 8vw, 50px)",
    fontSize: "clamp(16px, 4vw, 22px)",
    fontWeight: "bold",
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "clamp(10px, 2vw, 12px)",
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
    whiteSpace: "nowrap",
  },
  rollBtnDisabled: {
    backgroundColor: "#6b7280",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  rollingStatus: {
    marginTop: "clamp(15px, 3vw, 20px)",
    fontSize: "clamp(16px, 4vw, 20px)",
    color: "#fbbf24",
    fontWeight: "bold",
    animation: "pulse 1s ease-in-out infinite",
  }
};

// CSS 动画保持不变
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes cardFlip {
    0%, 100% { transform: rotateY(0deg); }
    50% { transform: rotateY(180deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @media (max-width: 480px) {
    button:active {
      transform: scale(0.95);
    }
  }
`;
document.head.appendChild(styleSheet);

export default NiuNiuGame;