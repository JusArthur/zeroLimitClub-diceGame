import React, { useState, useEffect } from "react";

const MinesweeperGame = ({ onBack }) => {
  const GRID_SIZE = 7;
  const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
  const MINE_COUNT = 1;
  const SAFE_CELLS = TOTAL_CELLS - MINE_COUNT;

  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [gameStatus, setGameStatus] = useState("playing"); // playing, won, lost
  const [revealedCount, setRevealedCount] = useState(0);
  const [minePosition, setMinePosition] = useState(null);

  // 初始化游戏
  const initGame = () => {
    // 生成随机地雷位置
    const minePos = Math.floor(Math.random() * TOTAL_CELLS);
    setMinePosition(minePos);

    // 初始化网格
    const newGrid = Array(TOTAL_CELLS).fill(false);
    newGrid[minePos] = true; // true = 地雷
    setGrid(newGrid);

    // 初始化revealed状态
    setRevealed(Array(TOTAL_CELLS).fill(false));
    setGameStatus("playing");
    setRevealedCount(0);
  };

  useEffect(() => {
    initGame();
  }, []);

  // 点击格子
  const handleCellClick = (index) => {
    if (gameStatus !== "playing" || revealed[index]) return;

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    // 点到地雷
    if (grid[index]) {
      setGameStatus("lost");
      // 显示所有格子
      setRevealed(Array(TOTAL_CELLS).fill(true));
    } else {
      // 安全格子
      const newCount = revealedCount + 1;
      setRevealedCount(newCount);
      
      // 检查是否获胜
      if (newCount === SAFE_CELLS) {
        setGameStatus("won");
        // 显示所有格子
        setRevealed(Array(TOTAL_CELLS).fill(true));
      }
    }
  };

  // 获取格子内容
  const getCellContent = (index) => {
    if (!revealed[index]) return "";
    if (grid[index]) return "💣";
    return "✓";
  };

  // 获取格子样式
  const getCellClass = (index) => {
    let classes = "mine-cell";
    
    if (revealed[index]) {
      if (grid[index]) {
        classes += " mine-cell-bomb";
      } else {
        classes += " mine-cell-safe";
      }
    }
    
    return classes;
  };

  return (
    <div style={styles.container}>
      <div style={styles.gameBox}>
        {/* 返回按钮 */}
        <button onClick={onBack} style={styles.backBtn}>
          ← 返回主菜单
        </button>

        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>零界突破</span>
          </div>
        </div>

        <h1 style={styles.title}>💣 扫雷游戏</h1>

        {/* 游戏信息 */}
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            安全格子: <span style={styles.infoNumber}>{revealedCount}/{SAFE_CELLS}</span>
          </p>
          <p style={styles.ruleText}>找出所有安全格子，若踩到地雷则游戏结束！</p>
        </div>

        {/* 游戏状态 */}
        {gameStatus !== "playing" && (
          <div style={{
            ...styles.resultBox,
            background: gameStatus === "won" 
              ? "linear-gradient(135deg, #d1fae5, #a7f3d0)"
              : "linear-gradient(135deg, #fee2e2, #fecaca)"
          }}>
            <h2 style={{
              ...styles.resultTitle,
              color: gameStatus === "won" ? "#065f46" : "#991b1b"
            }}>
              {gameStatus === "won" ? "🎉 恭喜获胜！" : "💥 游戏结束！"}
            </h2>
            <p style={styles.resultDesc}>
              {gameStatus === "won" 
                ? "成功避开地雷，找出所有安全格子！"
                : "踩到地雷了，再试一次吧！"}
            </p>
          </div>
        )}

        {/* 游戏网格 */}
        <div style={styles.gridContainer}>
          {grid.map((_, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              style={styles[getCellClass(index)]}
              disabled={gameStatus !== "playing" || revealed[index]}
            >
              {getCellContent(index)}
            </button>
          ))}
        </div>

        {/* 重新开始按钮 */}
        <button onClick={initGame} style={styles.restartBtn}>
          🔄 重新开始
        </button>

        {/* 底部信息 */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Zero Limit Breakthrough Club - 扫雷挑战
          </p>
          <p style={styles.hintText}>💣 7×7网格 · 1个地雷 · 48个安全格</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #14b8a6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  },
  gameBox: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
    padding: "32px",
    maxWidth: "600px",
    width: "100%",
    textAlign: "center",
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    top: "20px",
    left: "20px",
    background: "#6b7280",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  logoContainer: {
    marginBottom: "16px",
  },
  logoCircle: {
    width: "60px",
    height: "60px",
    background: "linear-gradient(135deg, #3b82f6, #1e40af)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
    border: "3px solid gold",
  },
  logoText: {
    color: "white",
    fontWeight: "bold",
    fontSize: "10px",
    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 24px 0",
  },
  infoBox: {
    background: "#eff6ff",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  infoText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 8px 0",
  },
  infoNumber: {
    fontSize: "24px",
    color: "#2563eb",
    fontWeight: "bold",
  },
  ruleText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0",
  },
  resultBox: {
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    border: "3px solid",
    borderColor: "#22c55e",
    animation: "resultAppear 0.6s ease-out",
  },
  resultTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
  },
  resultDesc: {
    fontSize: "16px",
    margin: "0",
    color: "#374151",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
    marginBottom: "24px",
    maxWidth: "420px",
    margin: "0 auto 24px auto",
  },
  "mine-cell": {
    width: "100%",
    aspectRatio: "1",
    border: "2px solid #d1d5db",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
    cursor: "pointer",
    fontSize: "20px",
    fontWeight: "bold",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  "mine-cell-safe": {
    width: "100%",
    aspectRatio: "1",
    border: "2px solid #22c55e",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
    fontSize: "20px",
    fontWeight: "bold",
    color: "#065f46",
    cursor: "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  "mine-cell-bomb": {
    width: "100%",
    aspectRatio: "1",
    border: "2px solid #ef4444",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #fee2e2, #fecaca)",
    fontSize: "20px",
    fontWeight: "bold",
    cursor: "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  restartBtn: {
    width: "100%",
    background: "linear-gradient(45deg, #10b981, #3b82f6)",
    color: "white",
    fontWeight: "bold",
    padding: "16px 24px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    transition: "all 0.2s ease",
    boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
  },
  footer: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
  },
  footerText: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 4px 0",
    fontWeight: "500",
  },
  hintText: {
    fontSize: "11px",
    color: "#f59e0b",
    margin: "0",
    fontWeight: "600",
  },
};

export default MinesweeperGame;