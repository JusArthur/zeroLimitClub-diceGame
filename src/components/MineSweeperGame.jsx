// MinesweeperGame.jsx
// A 7x7 Minesweeper mini-game component

import React, { useState, useEffect, useCallback } from "react";

const MinesweeperGame = ({ onBack }) => {
  const GRID_SIZE = 7;
  const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
  const MINE_COUNT = 1;
  const SAFE_CELLS = TOTAL_CELLS - MINE_COUNT;

  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [gameStatus, setGameStatus] = useState("playing");
  const [revealedCount, setRevealedCount] = useState(0);

  // Initialize the game
  const initGame = useCallback(() => {
    const minePos = Math.floor(Math.random() * TOTAL_CELLS);

    const newGrid = Array(TOTAL_CELLS).fill(false);
    newGrid[minePos] = true;
    setGrid(newGrid);

    setRevealed(Array(TOTAL_CELLS).fill(false));
    setGameStatus("playing");
    setRevealedCount(0);
  }, [TOTAL_CELLS]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Handle cell click
  const handleCellClick = (index) => {
    if (gameStatus !== "playing" || revealed[index]) return;

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (grid[index]) {
      // Hit a mine
      setGameStatus("lost");
      setRevealed(Array(TOTAL_CELLS).fill(true));
    } else {
      // Safe cell
      const newCount = revealedCount + 1;
      setRevealedCount(newCount);

      if (newCount === SAFE_CELLS) {
        setGameStatus("won");
        setRevealed(Array(TOTAL_CELLS).fill(true));
      }
    }
  };

  // Cell content
  const getCellContent = (index) => {
    if (!revealed[index]) return "";
    if (grid[index]) return "💣";
    return "✓";
  };

  // Cell style
  const getCellStyle = (index) => {
    const baseStyle = {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
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
    };

    if (revealed[index]) {
      if (grid[index]) {
        return {
          ...baseStyle,
          border: "2px solid #ef4444",
          background: "linear-gradient(135deg, #fee2e2, #fecaca)",
          cursor: "default",
        };
      } else {
        return {
          ...baseStyle,
          border: "2px solid #22c55e",
          background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
          color: "#065f46",
          cursor: "default",
        };
      }
    }

    return baseStyle;
  };

  return (
    <div style={styles.container}>
      <div style={styles.gameBox}>
        {/* Back Button */}
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

        {/* Info */}
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            安全格子:{" "}
            <span style={styles.infoNumber}>
              {revealedCount}/{SAFE_CELLS}
            </span>
          </p>
          <p style={styles.ruleText}>找出所有安全格子,若踩到地雷则游戏结束!</p>
        </div>

        {/* Result */}
        {gameStatus !== "playing" && (
          <div
            style={{
              ...styles.resultBox,
              background:
                gameStatus === "won"
                  ? "linear-gradient(135deg, #d1fae5, #a7f3d0)"
                  : "linear-gradient(135deg, #fee2e2, #fecaca)",
            }}
          >
            <h2
              style={{
                ...styles.resultTitle,
                color: gameStatus === "won" ? "#065f46" : "#991b1b",
              }}
            >
              {gameStatus === "won" ? "🎉 恭喜获胜!" : "💥 游戏结束!"}
            </h2>
            <p style={styles.resultDesc}>
              {gameStatus === "won"
                ? "成功避开地雷,找出所有安全格子!"
                : "踩到地雷了，很遗憾游戏结束!"}
            </p>
          </div>
        )}

        {/* Grid */}
        <div style={styles.gridContainer}>
          {grid.map((_, index) => (
            <div key={index} style={styles.cellWrapper}>
              <button
                onClick={() => handleCellClick(index)}
                style={getCellStyle(index)}
                disabled={gameStatus !== "playing" || revealed[index]}
              >
                {getCellContent(index)}
              </button>
            </div>
          ))}
        </div>

        {/* Restart Button */}
        <button onClick={initGame} style={styles.restartBtn}>
          🔄 重新开始
        </button>

        {/* Footer */}
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
    background:
      "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #14b8a6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
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
  cellWrapper: {
    width: "100%",
    paddingBottom: "100%",
    position: "relative",
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
