import React, { useState, useEffect, useRef } from "react";
import "./DiceGame.css"; // 需要引入CSS文件
import logo from "./pic/logo.png"; // 导入本地logo图片
import NiuNiuGame from "./components/niuniugame";

const DiceGame = () => {
  const [step, setStep] = useState("select");
  const [diceCount, setDiceCount] = useState(1);
  const [diceValues, setDiceValues] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);

  // localStorage 工具函数(替代 cookie)
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

  // 博饼游戏规则判断
  const checkBoResult = (values) => {
    if (values.length !== 6) return null; // 只有6个骰子才能玩博饼

    const counts = {};
    values.forEach((val) => {
      counts[val] = (counts[val] || 0) + 1;
    });

    // 按优先级从高到低判断

    // 红六勃：6个4
    if (counts[4] === 6) {
      return {
        name: "状元·六杯红",
        level: 10,
        description: "六个四,状元及第,至尊荣耀!",
        color: "#dc2626",
      };
    }

    // 遍地锦：6个1
    if (counts[1] === 6) {
      return {
        name: "状元·遍地锦",
        level: 9,
        description: "六个一,状元及第,极致稀有!",
        color: "#dc2626",
      };
    }

    // 黑六勃：6个相同
    for (let i of [2, 3, 5, 6]) {
      if (counts[i] === 6) {
        return {
          name: "状元·黑六勃",
          level: 8,
          description: "六子同辉,状元及第,独步天下!",
          color: "#1f2937",
        };
      }
    }
    // 插金花：4个4 + 2个1
    if (counts[4] === 4 && counts[1] === 2) {
      return {
        name: "状元·插金花",
        level: 7,
        description: "四个四加两个一,状元及第,锦上添花!",
        color: "#f59e0b",
      };
    }

    // 五红：5个4
    if (counts[4] === 5) {
      return {
        name: "状元·五红",
        level: 6,
        description: "五个四,状元及第,鸿运当头!",
        color: "#dc2626",
      };
    }

    // 五子登科：5个相同
    for (let i of [1, 2, 3, 5, 6]) {
      if (counts[i] === 5) {
        return {
          name: "状元·五子登科",
          level: 6,
          description: "五子同科,状元及第,喜气盈门!",
          color: "#dc2626",
        };
      }
    }

    // 四红：4个4
    if (counts[4] === 4) {
      return {
        name: "状元·四红",
        level: 5,
        description: "四个四,状元及第,运势非凡!",
        color: "#dc2626",
      };
    }

    // 榜眼：123456顺子
    const hasAllNumbers = [1, 2, 3, 4, 5, 6].every((num) => counts[num] === 1);
    if (hasAllNumbers) {
      return {
        name: "榜眼",
        level: 4,
        description: "顺子齐聚,才华横溢,榜眼之选!",
        color: "#7c3aed",
      };
    }

    // 探花：3个4
    if (counts[4] === 3) {
      return {
        name: "探花",
        level: 3,
        description: "三个四,风华出众,探花之姿!",
        color: "#dc2626",
      };
    }

    // 进士：4个相同
    for (let i of [1, 2, 3, 5, 6]) {
      if (counts[i] === 4) {
        return {
          name: "进士",
          level: 2,
          description: "四子齐聚,才学兼备,进士及第!",
          color: "#1f2937",
        };
      }
    }
    // 举人：2个4
    if (counts[4] === 2) {
      return {
        name: "举人",
        level: 1,
        description: "两个四,实力不凡,稳入举人!",
        color: "#dc2626",
      };
    }

    // 秀才：1个4
    if (counts[4] === 1) {
      return {
        name: "秀才",
        level: 0,
        description: "一个四,初露锋芒,秀才入门!",
        color: "#dc2626",
      };
    }

    // 无奖
    return {
      name: "无奖",
      level: -1,
      description: "未中佳手,再接再厉!",
      color: "#6b7280",
    };
  };

  useEffect(() => {
    if (step === "game") {
      setDiceValues(Array(diceCount).fill(1));
    }
  }, [step, diceCount]);

  // 页面加载时恢复历史
  useEffect(() => {
    const saved = getFromStorage("diceHistory");
    if (saved) {
      setHistory(saved);
    }
  }, []);

  // 每次历史更新时保存
  useEffect(() => {
    // 仅在博饼模式下保存历史
    if (diceCount === 6 && history.length > 0) {
      saveToStorage("diceHistory", history);
    }
  }, [history, diceCount]);

  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);
    setGameResult(null);

    // 先生成随机结果(不直接赋值,等动画时间结束后再应用)
    const finalValues = Array(diceCount)
      .fill(0)
      .map(() => {
        const randomBytes = new Uint32Array(1);
        crypto.getRandomValues(randomBytes);
        return (randomBytes[0] % 6) + 1;
      });

    // const finalValues = [5,5,5,5,5,5]; // 测试博饼结果用
    // const finalValues = [2,3,4,5,1,6]; 
    setTimeout(() => {
      setDiceValues(finalValues);

      // 检查博饼结果
      const result = checkBoResult(finalValues);
      setGameResult(result);

      // 保存历史记录
      if (diceCount === 6) {
        setHistory((prev) => [
          ...prev,
          { values: finalValues, result, time: new Date().toLocaleString() },
        ]);
      }

      setIsRolling(false);
    }, 2500);
  };

  const goBack = () => {
    setStep("select");
    setDiceValues([]);
    setIsRolling(false);
    setGameResult(null); // 清除游戏结果
  };

  const startGame = () => {
    setStep("game");
  };

  const toggleHistoryWindow = () => setHistoryCollapsed((s) => !s);

  if (step === "game" && diceCount === 5) {
    return <NiuNiuGame onBack={goBack} />;
  }
  // const clearHistory = () => {
  //   if (window.confirm("确定要清空所有历史记录吗?")) {
  //     setHistory([]);
  //     localStorage.removeItem("diceHistory");
  //   }
  // };

  if (step === "select") {
    return (
      <div className="app-container">
        <div className="select-container">
          {/* 俱乐部Logo */}
          <div className="club-logo">
            <img src={logo} alt="零界突破俱乐部" className="logo-image" />
          </div>
          <h1 className="main-title">🎲🎴零界突破俱乐部</h1>

          <div className="select-section">
            <h2 className="section-title">选择游戏类型</h2>
            <div className="game-mode-hint">
            <p>💡 6个骰子 = 传统博饼游戏</p>
            <p>🃏 5个骰子 = 牛牛扑克游戏</p>
            </div>
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
            <p>              已选择: {diceCount} 个{diceCount === 5 ? "扑克" : "骰子"}
              {diceCount === 5 && " - 牛牛模式"}
              {diceCount === 6 && " - 博饼模式"}</p>
          </div>

          <button onClick={startGame} className="start-btn">
            开始游戏 🎮
          </button>

          {/* 俱乐部商标 */}
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

  return (
    <div className="app-container">
      <div className="game-container">
        {/* 游戏页面Logo */}
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

            {/* 博饼游戏结果 */}
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

        {/* ===== collapsible history window (renders only when history exists) ===== */}
        {diceCount === 6 && history.length > 0 && (
          <div
            className={`history-window ${
              historyCollapsed ? "collapsed" : "expanded"
            }`}
            role="region"
            aria-label="History"
          >
            {/* toggle button (always visible) */}
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

            {/* expanded content */}
            {!historyCollapsed && (
              <div className="history-content" aria-live="polite">
                <div className="history-header">
                  <h3 className="history-title">📜 历史记录</h3>
                  <div className="history-actions">
                    {/* <button
                      className="history-clear-btn"
                      onClick={clearHistory}
                      title="清空历史"
                    >
                      🗑️
                    </button> */}
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
        {/* ===== end history window ===== */}

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

// 3D骰子组件
const Dice3D = ({ value, isRolling, delay = 0 }) => {
  const diceRef = useRef();

  const getDotPattern = (num) => {
    const patterns = {
      1: [4], // 中心
      2: [0, 8], // 对角
      3: [0, 4, 8], // 对角+中心
      4: [0, 2, 6, 8], // 四角
      5: [0, 2, 4, 6, 8], // 四角+中心
      6: [0, 2, 3, 5, 6, 8], // 左右各三个
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
      1: "rotateX(0deg) rotateY(0deg)", // front
      2: "rotateX(-90deg) rotateY(0deg)", // top
      3: "rotateX(0deg) rotateY(-90deg)", // right
      4: "rotateX(0deg) rotateY(90deg)", // left
      5: "rotateX(90deg) rotateY(0deg)", // bottom
      6: "rotateX(0deg) rotateY(180deg)", // back
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