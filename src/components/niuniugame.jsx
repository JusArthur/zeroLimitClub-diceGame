/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import HistoryRecord from "./HistoryRecord";

// 牛牛游戏组件
const NiuNiuGame = ({ onBack }) => {
  const [cards, setCards] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [revealedCards, setRevealedCards] = useState([
    false,
    false,
    false,
    false,
    false,
  ]);


  // Local storage utility functions
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

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = getFromStorage("niuNiuHistory");
    if (saved) {
      setHistory(saved);
    }
  }, []);

  // Save history to localStorage whenever it updates
  useEffect(() => {
    if (history.length > 0) {
      saveToStorage("niuNiuHistory", history);
    }
  }, [history]);

  // 可调节的概率配置 (0-1之间，越小越稀有)
  const RARE_PROBABILITIES = {
    wuHuaNiu: 0.0003, // 五花牛 0.03%
    wuXiaoNiu: 0.000005, // 五小牛 0.0005%
    zhaDan: 0.0002, // 炸弹 0.02%
    noNiu: 0.2, // 没牛 ~51%
    niuNiu: 0.03, // 牛牛 ~2%
    niuJiu: 0.05, // 牛9 ~3%
    niuBa: 0.06, // 牛8 ~3%
  };

  // 扑克牌花色和点数
  const suits = ["♠", "♥", "♦", "♣"];
  const suitColors = {
    "♠": "#000",
    "♥": "#dc2626",
    "♦": "#dc2626",
    "♣": "#000",
  };

  // 获取牌面值
  const getCardValue = (card) => {
    if (card.rank === "A") return 1;
    if (["J", "Q", "K"].includes(card.rank)) return 10;
    return parseInt(card.rank);
  };

  // 检查是否为花牌
  const isFlowerCard = (card) => ["J", "Q", "K"].includes(card.rank);

  // 生成一张随机牌
  const generateRandomCard = () => {
    const ranks = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
    return { suit: randomSuit, rank: randomRank };
  };

  // 根据概率决定是否触发稀有牌型
  const shouldTriggerRare = (probability) => {
    return Math.random() < probability;
  };

  // 检测是否为特殊牌型（用于过滤普通生成）
  const isSpecialCardType = (cardHand) => {
    if (cardHand.length !== 5) return false;

    const values = cardHand.map(getCardValue);
    const allFlowers = cardHand.every(isFlowerCard);
    const allSmall = cardHand.every((c) => getCardValue(c) <= 5);

    // 检查炸弹
    const rankCounts = {};
    cardHand.forEach((card) => {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });
    const hasBomb = Object.values(rankCounts).some((count) => count === 4);

    if (hasBomb) return true;

    // 检查五小牛
    if (allSmall && values.reduce((a, b) => a + b, 0) <= 10) return true;

    // 检查五花牛
    if (allFlowers) return true;

    // 检查牛牛
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 4; j++) {
        for (let k = j + 1; k < 5; k++) {
          const sum = values[i] + values[j] + values[k];
          if (sum % 10 === 0) {
            // 找到三张和为10的倍数
            const remaining = values.filter(
              (_, idx) => idx !== i && idx !== j && idx !== k
            );
            if ((remaining[0] + remaining[1]) % 10 === 0) {
              return true; // 剩余两张和mod 10 = 0，满足牛牛
            }
          }
        }
      }
    }

    // 检查牛9
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 4; j++) {
        for (let k = j + 1; k < 5; k++) {
          const sum = values[i] + values[j] + values[k];
          if (sum % 10 === 0) {
            // 找到三张和为10的倍数
            const remaining = values.filter(
              (_, idx) => idx !== i && idx !== j && idx !== k
            );
            if ((remaining[0] + remaining[1]) % 10 === 9) {
              return true; // 剩余两张和mod 10 = 9，满足牛9
            }
          }
        }
      }
    }

    // 检查牛牛
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 4; j++) {
        for (let k = j + 1; k < 5; k++) {
          const sum = values[i] + values[j] + values[k];
          if (sum % 10 === 0) {
            // 找到三张和为10的倍数
            const remaining = values.filter(
              (_, idx) => idx !== i && idx !== j && idx !== k
            );
            if ((remaining[0] + remaining[1]) % 10 === 8) {
              return true; // 剩余两张和mod 10 = 8，满足牛8
            }
          }
        }
      }
    }
    return false;
  };

  // 生成普通牌（确保不是特殊牌型）
  const generateNormalCards = () => {
    let attempts = 0;
    const maxAttempts = 100; // 防止无限循环

    while (attempts < maxAttempts) {
      const cards = Array(5).fill(0).map(generateRandomCard);

      if (!isSpecialCardType(cards)) {
        return cards;
      }

      attempts++;
    }

    // 如果100次都生成特殊牌，返回最后一组（极小概率）
    return Array(5).fill(0).map(generateRandomCard);
  };

  // 生成特定牌型
  const generateSpecialHand = (type) => {
    const ranks = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ];

    switch (type) {
      case "zhaDan": // 炸弹：4张相同
        const bombRank = ranks[Math.floor(Math.random() * ranks.length)];
        const bombCards = suits
          .slice(0, 4)
          .map((suit) => ({ suit, rank: bombRank }));
        const fifthCard = generateRandomCard();
        return [...bombCards, fifthCard];

      case "wuXiaoNiu": // 五小牛：5张牌都小于5且总和≤10
        const smallRanks = ["A", "2", "3", "4"];
        let attempts = 0;
        const maxAttempts = 100; // 防止极端随机无限（虽概率极低）
        while (attempts < maxAttempts) {
          const wuXiaoCards = [];
          let total = 0;
          for (let i = 0; i < 5; i++) {
            const rank =
              smallRanks[Math.floor(Math.random() * smallRanks.length)];
            const suit = suits[Math.floor(Math.random() * suits.length)];
            const value = getCardValue({ rank });
            wuXiaoCards.push({ suit, rank });
            total += value;
          }
          if (total <= 10) {
            return wuXiaoCards; // 满足条件，直接返回
          }
          attempts++;
        }

        // 如果重试失败，返回一个默认（或抛错），但实际不会发生
        return Array(5)
          .fill(0)
          .map(() => ({ suit: suits[0], rank: "A" })); // 默认全A

      case "wuHuaNiu": // 五花牛：5张都是JQK
        const flowerRanks = ["J", "Q", "K"];
        return Array(5)
          .fill(0)
          .map(() => ({
            suit: suits[Math.floor(Math.random() * suits.length)],
            rank: flowerRanks[Math.floor(Math.random() * flowerRanks.length)],
          }));

      case "niuNiu": // 牛牛：三张和为10的倍数，剩余两张和mod 10 = 0
        let niuNiuAttempts = 0;
        const niuNiuMaxAttempts = 100;
        while (niuNiuAttempts < niuNiuMaxAttempts) {
          const cards = Array(5).fill(0).map(generateRandomCard);
          const values = cards.map(getCardValue);
          for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 4; j++) {
              for (let k = j + 1; k < 5; k++) {
                const sum = values[i] + values[j] + values[k];
                if (sum % 10 === 0) {
                  const remaining = values.filter(
                    (_, idx) => idx !== i && idx !== j && idx !== k
                  );
                  if ((remaining[0] + remaining[1]) % 10 === 0) {
                    return cards; // 满足牛牛条件
                  }
                }
              }
            }
          }
          niuNiuAttempts++;
        }
        // 如果重试失败，返回普通牌

        return generateNormalCards();

      case "niuJiu":
        // 牛九：三张和为10的倍数，剩余两张和mod 10 = 9
        let niuJiuAttempts = 0;
        const niuJiuMaxAttempts = 100;
        while (niuJiuAttempts < niuJiuMaxAttempts) {
          const cards = Array(5).fill(0).map(generateRandomCard);
          const values = cards.map(getCardValue);
          for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 4; j++) {
              for (let k = j + 1; k < 5; k++) {
                const sum = values[i] + values[j] + values[k];
                if (sum % 10 === 0) {
                  const remaining = values.filter(
                    (_, idx) => idx !== i && idx !== j && idx !== k
                  );
                  if ((remaining[0] + remaining[1]) % 10 === 9) {
                    return cards; // 满足牛9条件
                  }
                }
              }
            }
          }
          niuJiuAttempts++;
        }
        // 如果重试失败，返回普通牌

        return generateNormalCards();

      case "niuBa":
        // 牛8：三张和为10的倍数，剩余两张和mod 10 = 8
        let niuBaAttempts = 0;
        const niuBaMaxAttempts = 100;
        while (niuBaAttempts < niuBaMaxAttempts) {
          const cards = Array(5).fill(0).map(generateRandomCard);
          const values = cards.map(getCardValue);
          for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 4; j++) {
              for (let k = j + 1; k < 5; k++) {
                const sum = values[i] + values[j] + values[k];
                if (sum % 10 === 0) {
                  const remaining = values.filter(
                    (_, idx) => idx !== i && idx !== j && idx !== k
                  );
                  if ((remaining[0] + remaining[1]) % 10 === 8) {
                    return cards; // 满足牛8条件
                  }
                }
              }
            }
          }
          niuBaAttempts++;
        }
        // 如果重试失败，返回普通牌

        return generateNormalCards();
      default:
        return null;
    }
  };

  // 检查牛牛结果
  const checkNiuNiuResult = (cardHand) => {
    if (cardHand.length !== 5) return null;

    const values = cardHand.map(getCardValue);
    const allFlowers = cardHand.every(isFlowerCard);
    const allSmall = cardHand.every((c) => getCardValue(c) <= 5);

    // 中文数字映射
    const chineseNumbers = [
      "零",
      "一",
      "二",
      "三",
      "四",
      "五",
      "六",
      "七",
      "八",
      "九",
    ];

    // 检查炸弹（4张相同）
    const rankCounts = {};
    cardHand.forEach((card) => {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });
    const hasBomb = Object.values(rankCounts).some((count) => count === 4);

    if (hasBomb) {
      return {
        name: "炸弹",
        multiplier: "x17",
        description: "四张相同！威力无穷！",
        color: "#dc2626",
      };
    }

    // 五小牛：都小于5且总和≤10
    if (allSmall && values.reduce((a, b) => a + b, 0) <= 10) {
      return {
        name: "五小牛",
        multiplier: "x20",
        description: "小牌大智慧！",
        color: "#f59e0b",
      };
    }

    // 五花牛：全是JQK
    if (allFlowers) {
      return {
        name: "五花牛",
        multiplier: "x15",
        description: "满堂花开！",
        color: "#7c3aed",
      };
    }

    // 尝试所有组合找牛
    let bestNiu = null;

    // 遍历所有3张牌的组合
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 4; j++) {
        for (let k = j + 1; k < 5; k++) {
          const sum = values[i] + values[j] + values[k];
          if (sum % 10 === 0) {
            // 找到了可以凑成10的倍数
            const remaining = values.filter(
              (_, idx) => idx !== i && idx !== j && idx !== k
            );
            const niuValue = (remaining[0] + remaining[1]) % 10;

            if (!bestNiu || niuValue > bestNiu.value) {
              bestNiu = { value: niuValue, combo: [i, j, k] };
            }
          }
        }
      }
    }

    if (bestNiu) {
      const niuNum = bestNiu.value;
      if (niuNum === 0) {
        return {
          name: "牛牛",
          multiplier: "x10",
          description: "完美组合！",
          color: "#059669",
        };
      } else {
        return {
          name: `牛${chineseNumbers[niuNum]}`,
          multiplier: `x${niuNum}`,
          description: niuNum >= 7 ? "大牛来了！" : "小有收获！",
          color: niuNum >= 7 ? "#059669" : "#6b7280",
        };
      }
    }

    return {
      name: "没牛",
      multiplier: "x0",
      description: "再接再厉！",
      color: "#9ca3af",
    };
  };

  // 生成牌并检查是否满足没牛要求
  const generateCardsWithNoNiuPreference = () => {
    let finalCards;
    let result;

    if (shouldTriggerRare(RARE_PROBABILITIES.zhaDan)) {
      finalCards = generateSpecialHand("zhaDan");
    } else if (shouldTriggerRare(RARE_PROBABILITIES.wuXiaoNiu)) {
      finalCards = generateSpecialHand("wuXiaoNiu");
    } else if (shouldTriggerRare(RARE_PROBABILITIES.wuHuaNiu)) {
      finalCards = generateSpecialHand("wuHuaNiu");
    } else if (shouldTriggerRare(RARE_PROBABILITIES.noNiu)) {
      // 尝试生成没牛的牌
      let normalAttempts = 0;
      const normalMaxAttempts = 50;
      do {
        finalCards = generateNormalCards();
        result = checkNiuNiuResult(finalCards);
        normalAttempts++;
      } while (result.name !== "没牛" && normalAttempts < normalMaxAttempts);
    } else if (shouldTriggerRare(RARE_PROBABILITIES.niuNiu)) {
      finalCards = generateSpecialHand("niuNiu");
    } else if (shouldTriggerRare(RARE_PROBABILITIES.niuJiu)) {
        finalCards = generateSpecialHand("niuJiu");
    } else if (shouldTriggerRare(RARE_PROBABILITIES.niuBa)) {
        finalCards = generateSpecialHand("niuBa");
    }
     else {
      finalCards = generateNormalCards();
    }

    return finalCards;
  };

  // 摇牌
  const rollCards = () => {
    if (isRolling) return;

    setIsRolling(true);
    setGameResult(null);
    setRevealedCards([false, false, false, false, false]);

    // 生成牌，优先尝试没牛
    const finalCards = generateCardsWithNoNiuPreference();

    // Set initial cards immediately
    setCards(finalCards);

    // Sequentially reveal cards
    const fastInterval = 500; // Time between first three cards (ms)
    const slowInterval = 1000; // Time between last two cards (ms)
    finalCards.forEach((_, index) => {
      const delay =
        index < 3
          ? fastInterval * (index + 1)
          : fastInterval * 3 + slowInterval * (index - 2);
      setTimeout(() => {
        setRevealedCards((prev) => {
          const newRevealed = [...prev];
          newRevealed[index] = true;
          return newRevealed;
        });

        // When all cards are revealed, show result
        if (index === finalCards.length - 1) {
          setTimeout(() => {
            const result = checkNiuNiuResult(finalCards);
            setGameResult(result);

            setHistory((prev) => {
              const newHistory = [
                ...prev,
                {
                  cards: finalCards,
                  result,
                  time: new Date().toLocaleString(),
                },
              ];
              return newHistory;
            });

            setIsRolling(false);
          }, fastInterval);
        }
      }, delay);
    });
  };

  useEffect(() => {
    setCards(Array(5).fill(0).map(generateRandomCard));
  }, []);

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
                {card.suit}
              </div>
              <div style={{ ...styles.cardRank, color: suitColors[card.suit] }}>
                {card.rank}
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
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "30px",
    gap: "15px",
  },
  backBtn: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s",
  },
  title: {
    fontSize: "28px",
    color: "#fff",
    margin: 0,
    textAlign: "center",
    flex: 1,
  },
  spacer: {
    width: "100px",
  },
  gameArea: {
    maxWidth: "800px",
    margin: "0 auto",
    textAlign: "center",
  },
  cardsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "30px",
    minHeight: "180px",
  },
  card: {
    width: "120px",
    height: "170px",
    backgroundColor: "#fff",
    borderRadius: "12px",
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
    fontSize: "40px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  cardRank: {
    fontSize: "32px",
    fontWeight: "bold",
  },
  resultBox: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: "16px",
    padding: "25px",
    margin: "30px auto",
    maxWidth: "500px",
    border: "3px solid",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  },
  resultName: {
    fontSize: "32px",
    fontWeight: "bold",
    margin: "0 0 15px 0",
  },
  resultDetails: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "15px",
  },
  multiplier: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#059669",
    backgroundColor: "#d1fae5",
    padding: "5px 15px",
    borderRadius: "20px",
  },
  description: {
    fontSize: "18px",
    color: "#4b5563",
    margin: 0,
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "20px",
  },
  rollBtn: {
    padding: "18px 50px",
    fontSize: "22px",
    fontWeight: "bold",
    backgroundColor: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
  },
  testBtn: {
    padding: "18px 50px",
    fontSize: "22px",
    fontWeight: "bold",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
  },
  rollBtnDisabled: {
    backgroundColor: "#6b7280",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  rollingStatus: {
    marginTop: "20px",
    fontSize: "20px",
    color: "#fbbf24",
    fontWeight: "bold",
    animation: "pulse 1s ease-in-out infinite",
  },
  testResultsContainer: {
    maxWidth: "600px",
    margin: "40px auto",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  },
  testResultsTitle: {
    fontSize: "24px",
    color: "#1f2937",
    marginBottom: "20px",
    textAlign: "center",
  },
  testResultsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  testResultItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: "8px",
    fontSize: "16px",
  },
  testResultName: {
    fontWeight: "bold",
    color: "#1f2937",
  },
  testResultCount: {
    color: "#4b5563",
  },
  historySection: {
    maxWidth: "600px",
    margin: "40px auto 0",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "20px",
    backdropFilter: "blur(10px)",
  },
  historyTitle: {
    color: "#fff",
    fontSize: "20px",
    marginBottom: "15px",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: "8px",
    fontSize: "14px",
  },
  historyTime: {
    color: "#6b7280",
  },
  historyResult: {
    fontWeight: "bold",
  },
};

// 添加CSS动画
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
`;
document.head.appendChild(styleSheet);

export default NiuNiuGame;
