import React, { useState, useEffect, useRef } from "react";
import "./DiceGame.css";
import logo from "../../assests/icons/logo.svg";
import NiuNiuGame from "../niuniugame";
import MinesweeperGame from "../MineSweeperGame";
import LuckyWheel from "../LuckyWheel";

const DiceGame = () => {
  const [step, setStep] = useState("menu");
  const [diceCount, setDiceCount] = useState(1);
  const [diceValues, setDiceValues] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
  const [minesweeperSize, setMinesweeperSize] = useState(7);
  const [selectedGame, setSelectedGame] = useState("dice");

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
    if (step === "game") {
      setDiceValues(Array(diceCount).fill(1));
    }
  }, [step, diceCount]);

  useEffect(() => {
    const saved = getFromStorage("diceHistory");
    if (saved) {
      setHistory(saved);
    }
  }, []);

  useEffect(() => {
    if (diceCount === 6 && history.length > 0) {
      saveToStorage("diceHistory", history);
    }
  }, [history, diceCount]);

  const rollDice = async () => {
    if (isRolling) return;

    setIsRolling(true);
    setGameResult(null);

    try {
      // Fetch securely from Go backend
      const response = await fetch('/.netlify/functions/rollDice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diceCount })
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const secureData = await response.json();
      const finalValues = secureData.diceValues;
      const result = secureData.result;

      // Mask network latency with the animation
      setTimeout(() => {
        setDiceValues(finalValues);
        setGameResult(result);

        if (diceCount === 6) {
          setHistory((prev) => [
            ...prev,
            { values: finalValues, result, time: new Date().toLocaleString() },
          ]);
        }

        setIsRolling(false);
      }, 2500);

    } catch (error) {
      console.error("Failed to fetch secure roll:", error);
      alert("服务器连接失败，请重试。");
      setIsRolling(false);
    }
  };

  const goBack = () => {
    if (diceCount === 6) {
      setStep("menu");
    } else if (step === "niuniu") {
      setStep("menu");
    } else if (step === "minesweeper") {
      setStep("minesweeper-select");
    } else if (step === "luckywheel") {
      setStep("menu");
    } else {
      setStep("select");
    }
    setDiceValues([]);
    setIsRolling(false);
    setGameResult(null);
  };

  const startGame = () => {
    setStep("game");
  };

  const toggleHistoryWindow = () => setHistoryCollapsed((s) => !s);

  if (step === "menu") {
    return (
      <div className="app-container">
        <div className="select-container">
          <div className="club-logo">
            <img src={logo} alt="零界突破俱乐部" className="logo-image" />
          </div>
          <h1 className="main-title">🎲 零界突破俱乐部</h1>
          <h1 className="main-title">🎮 游戏中心</h1>
  
          <div className="select-section">
            <h2 className="section-title">选择游戏模式</h2>
  
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                marginBottom: "20px",
                cursor: "pointer",
              }}
            >
              <option value="dice">🎲 骰子游戏 (默认)</option>
              <option value="bobing">🥮 博饼游戏</option>
              <option value="niuniu">🃏 牛牛游戏</option>
              <option value="minesweeper">💣 扫雷游戏</option>
              <option value="luckywheel">🎡 转盘抽奖</option>
            </select>
  
            <button
              onClick={() => {
                if (selectedGame === "bobing") {
                  setDiceCount(6);
                  setStep("game");
                } else if (selectedGame === "niuniu") {
                  setDiceCount(5);
                  setStep("niuniu");
                } else if (selectedGame === "dice") {
                  setStep("select");
                } else if (selectedGame === "minesweeper") {
                  setStep("minesweeper-select");
                } else if (selectedGame === "luckywheel") {
                  setStep("luckywheel");
                }
              }}
              className="start-btn"
            >
              确认选择 🎮
            </button>
          </div>
  
          <div className="club-trademark">
            <p className="trademark-text">
              © 2025 零界突破俱乐部 | Zero Limit Breakthrough Club
            </p>
            <p className="club-slogan">突破极限,创造无限可能</p>
            <p className="club-slogan">
              该游戏仅供娱乐，无不良引导与金钱交易行为
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (step === "minesweeper-select") {
    return (
      <div className="app-container">
        <div className="select-container">
          <button onClick={() => setStep("menu")} className="back-btn">
            ← 返回主菜单
          </button>
          
          <div className="club-logo">
            <img src={logo} alt="零界突破俱乐部" className="logo-image" />
          </div>
          <h1 className="main-title">💣 扫雷游戏</h1>
  
          <div className="select-section">
            <h2 className="section-title">选择网格大小</h2>
            <div className="game-mode-grid">
              <button
                className="mode-box"
                onClick={() => {
                  setMinesweeperSize(5);
                  setStep("minesweeper");
                }}
              >
                💣 5×5 网格
                <p className="mode-desc">简单模式 · 24个安全格</p>
              </button>
  
              <button
                className="mode-box"
                onClick={() => {
                  setMinesweeperSize(7);
                  setStep("minesweeper");
                }}
              >
                💣 7×7 网格
                <p className="mode-desc">标准模式 · 48个安全格</p>
              </button>
            </div>
          </div>
  
          <div className="club-trademark">
            <p className="trademark-text">
              © 2025 零界突破俱乐部 | Zero Limit Breakthrough Club
            </p>
            <p className="club-slogan">突破极限,创造无限可能</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className="app-container">
        <div className="select-container">
          <button onClick={() => setStep("menu")} className="back-btn">
            ← 返回主菜单
          </button>
          <div className="club-logo">
            <img src={logo} alt="零界突破俱乐部" className="logo-image" />
          </div>
          <h1 className="main-title">🎲🎴零界突破俱乐部</h1>

          <div className="select-section">
            <h2 className="section-title">选择骰子数量</h2>
            <div className="game-mode-hint"></div>
            <div className="number-grid">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setDiceCount(num)}
                  className={`number-btn ${
                    diceCount === num ? "selected" : ""
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="selected-info">
            <p> 已选择: {diceCount} 个骰子</p>
          </div>

          <button onClick={startGame} className="start-btn">
            开始游戏 🎮
          </button>

          <div className="club-trademark">
            <p className="trademark-text">
              © 2025 零界突破俱乐部 | Zero Limit Breakthrough Club
            </p>
            <p className="club-slogan">突破极限,创造无限可能</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "niuniu") {
    return <NiuNiuGame onBack={goBack} />;
  }

  if (step === "minesweeper") {
    return <MinesweeperGame onBack={() => setStep("minesweeper-select")} gridSize={minesweeperSize} />;
  }

  if (step === "luckywheel") {
    return <LuckyWheel onBack={goBack} />;
  }

  return (
    <div className="app-container">
      <div className="game-container">
        <div className="game-logo">
          <img src={logo} alt="零界突破俱乐部" className="logo-image-small" />
        </div>

        <div className="game-header">
          <button onClick={goBack} className="back-btn">
            ← 返回
          </button>
          <h1 className="game-title">🎲 中秋庆典-零界突破俱乐部</h1>
          <div className="spacer"></div>
        </div>

        <div className="game-content">
          <p className="dice-count-text">你有 {diceCount} 个骰子</p>

          <div
            className={`dice-area ${diceCount > 3 ? "large-dice-area" : ""}`}
          >
            {diceValues.map((value, index) => (
              <Dice3D
                key={index}
                value={value}
                isRolling={isRolling}
                delay={index * 200}
              />
            ))}
          </div>
        </div>

        {diceValues.length > 0 && !isRolling && (
          <div className="result-section">
            <p className="total-text">
              总点数:{" "}
              <span className="total-number">
                {diceValues.reduce((a, b) => a + b, 0)}
              </span>
            </p>

            {gameResult && (
              <div
                className="bo-result"
                style={{ borderColor: gameResult.color }}
              >
                <div className="result-header">
                  <h3
                    className="result-name"
                    style={{ color: gameResult.color }}
                  >
                    🎉 {gameResult.name}
                  </h3>
                  <div className="result-level">等级 {gameResult.level}</div>
                </div>
                <p className="result-description">{gameResult.description}</p>
                {gameResult.name === "状元·六杯红" && (
                  <div className="celebration">🎊 恭喜高中状元! 🎊</div>
                )}
                {gameResult.name === "状元·插金花" && (
                  <div className="celebration">✨ 极品奖励! ✨</div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={rollDice}
          disabled={isRolling}
          className={`roll-btn ${isRolling ? "rolling" : ""}`}
        >
          {isRolling ? "摇骰子中... 🎲" : "摇骰子 🎲"}
        </button>

        {isRolling && (
          <div className="rolling-status">
            <p className="rolling-text">买定离手...</p>
          </div>
        )}

        {diceCount === 6 && history.length > 0 && (
          <div
            className={`history-window ${
              historyCollapsed ? "collapsed" : "expanded"
            }`}
            role="region"
            aria-label="History"
          >
            <button
              className="history-toggle-btn"
              onClick={toggleHistoryWindow}
              aria-expanded={!historyCollapsed}
              aria-label={
                historyCollapsed
                  ? `Open history (${history.length})`
                  : "Collapse history"
              }
            >
              {historyCollapsed ? `📜 ${history.length}` : "📜"}
            </button>

            {!historyCollapsed && (
              <div className="history-content" aria-live="polite">
                <div className="history-header">
                  <h3 className="history-title">📜 历史记录</h3>
                  <div className="history-actions">
                    <button
                      className="history-collapse-btn"
                      onClick={toggleHistoryWindow}
                      title="收起"
                    >
                      −
                    </button>
                  </div>
                </div>

                <ul className="history-list">
                  {history
                    .slice()
                    .reverse()
                    .map((item, idx) => (
                      <li key={idx} className="history-item">
                        <span className="history-time">{item.time}</span> —{" "}
                        <span
                          className="history-result"
                          style={{ color: item.result?.color || "#000" }}
                        >
                          {item.result?.name || "无奖"}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="game-footer">
          <p className="footer-text">
            Zero Limit Breakthrough Club - 中秋博饼庆典特别版
          </p>
          {diceCount === 6 && (
            <p className="bo-game-hint">🥮 传统博饼游戏模式 🥮</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Dice3D = ({ value, isRolling, delay = 0 }) => {
  const diceRef = useRef();

  const getDotPattern = (num) => {
    const patterns = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    return patterns[num] || [];
  };

  const renderFace = (faceValue, faceClass) => (
    <div className={`dice-face ${faceClass}`}>
      <div className="dots-container">
        <div className="dots-grid">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="dot-position">
              {getDotPattern(faceValue).includes(i) && (
                <div className="dot"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const getDiceFinalRotation = (value) => {
    const rotations = {
      1: "rotateX(0deg) rotateY(0deg)",
      2: "rotateX(-90deg) rotateY(0deg)",
      3: "rotateX(0deg) rotateY(-90deg)",
      4: "rotateX(0deg) rotateY(90deg)",
      5: "rotateX(90deg) rotateY(0deg)",
      6: "rotateX(0deg) rotateY(180deg)",
    };
    return rotations[value] || rotations[1];
  };

  return (
    <div className="dice-container">
      <div
        ref={diceRef}
        className={`dice-cube ${isRolling ? "cube-rolling" : ""}`}
        style={{
          animationDelay: `${delay}ms`,
          transform: isRolling ? "" : getDiceFinalRotation(value),
        }}
      >
        {renderFace(1, "face-front")}
        {renderFace(6, "face-back")}
        {renderFace(3, "face-right")}
        {renderFace(4, "face-left")}
        {renderFace(2, "face-top")}
        {renderFace(5, "face-bottom")}
      </div>
    </div>
  );
};

export default DiceGame;