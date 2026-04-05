import React, { useState, useEffect, useCallback } from "react";

const MinesweeperGame = ({ onBack, gridSize = 7 }) => {
  const GRID_SIZE = gridSize;
  const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
  const MINE_COUNT = 1;
  const SAFE_CELLS = TOTAL_CELLS - MINE_COUNT;

  // The grid now only tracks whether a cell is revealed or if it contains a confirmed mine (at game over)
  const [revealed, setRevealed] = useState(Array(TOTAL_CELLS).fill(false));
  const [minePositions, setMinePositions] = useState(Array(TOTAL_CELLS).fill(false));
  
  const [gameStatus, setGameStatus] = useState("playing");
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [showRestartWarning, setShowRestartWarning] = useState(false);
  const [currentGameId, setCurrentGameId] = useState(null);
  
  // Security + Network state
  const [gameStateToken, setGameStateToken] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const STORAGE_KEY_HISTORY = `minesweeper_history_${GRID_SIZE}x${GRID_SIZE}`;
  const STORAGE_KEY_STATE = `minesweeper_state_${GRID_SIZE}x${GRID_SIZE}`;
  const API_ENDPOINT = "/.netlify/functions/minesweeper"; // Update this if your function path is different

  const loadGameHistory = useCallback(() => {
    const history = localStorage.getItem(STORAGE_KEY_HISTORY);
    let parsed = [];
    if (history) {
      try {
        parsed = JSON.parse(history);
      } catch (e) {
        parsed = [];
      }
    }
    setGameHistory(parsed);
  }, [STORAGE_KEY_HISTORY]);

  const saveGameRecord = useCallback((status, score, isManualRestart = false) => {
    const now = new Date();
    const newResult = status === 'won' ? '获胜' :
                      status === 'lost' ? '失败' :
                      status === 'playing' ? '进行中' : '未完成';
    const newScore = `${score}/${SAFE_CELLS}`;

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');

    const isUpdate = history.length > 0 && 
                     history[0].gameId === currentGameId && 
                     history[0].result === '进行中';

    if (isUpdate) {
      history[0].result = newResult;
      history[0].score = newScore;
      history[0].time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      if (status === 'incomplete') {
        history[0].isManualRestart = isManualRestart;
      }
    } else {
      const record = {
        date: now.toLocaleDateString('zh-CN'),
        time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        result: newResult,
        score: newScore,
        timestamp: now.getTime(),
        isManualRestart: isManualRestart,
        gameId: currentGameId
      };
      history.unshift(record);
    }

    const limitedHistory = history.slice(0, 10);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(limitedHistory));
    setGameHistory(limitedHistory);
  }, [SAFE_CELLS, STORAGE_KEY_HISTORY, currentGameId]);

  // Request new game from Server
  const initGame = useCallback(async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "INIT", gridSize: GRID_SIZE })
      });
      const data = await response.json();
      
      if (data.status === "playing") {
        setGameStateToken(data.gameStateToken);
        setRevealed(Array(TOTAL_CELLS).fill(false));
        setMinePositions(Array(TOTAL_CELLS).fill(false));
        setGameStatus("playing");
        setRevealedCount(0);
        setShowRestartWarning(false);
        
        const newGameId = Math.random().toString(36).substring(2);
        setCurrentGameId(newGameId);
        
        // Save encrypted state to local storage
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({
          gameStateToken: data.gameStateToken,
          revealed: Array(TOTAL_CELLS).fill(false),
          gameStatus: "playing",
          revealedCount: 0,
          currentGameId: newGameId
        }));
      }
    } catch (error) {
      console.error("Failed to initialize game:", error);
      alert("网络错误, 无法初始化游戏");
    } finally {
      setIsProcessing(false);
    }
  }, [GRID_SIZE, TOTAL_CELLS, STORAGE_KEY_STATE]);

  const loadGameState = useCallback(() => {
    const savedState = localStorage.getItem(STORAGE_KEY_STATE);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.gameStatus === 'playing' && state.gameStateToken) {
          setGameStateToken(state.gameStateToken);
          setRevealed(state.revealed);
          setGameStatus(state.gameStatus);
          setRevealedCount(state.revealedCount);
          setCurrentGameId(state.currentGameId);
          return true;
        }
      } catch (e) {}
    }
    return false;
  }, [STORAGE_KEY_STATE]);

  useEffect(() => {
    loadGameHistory();
    if (!loadGameState()) {
      initGame();
    }
  }, [initGame, loadGameHistory, loadGameState]);

  // Handle cell click with server validation
  const handleCellClick = async (index) => {
    if (gameStatus !== "playing" || revealed[index] || isProcessing || !gameStateToken) return;

    setIsProcessing(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "CLICK", gameStateToken, cellIndex: index })
      });
      const data = await response.json();

      if (data.error) throw new Error(data.message);

      const newRevealed = [...revealed];
      newRevealed[index] = true;
      setRevealed(newRevealed);

      if (data.status === "lost") {
        setGameStatus("lost");
        // Reveal all cells
        setRevealed(Array(TOTAL_CELLS).fill(true));
        // Server finally tells us where the mine is
        const newMines = Array(TOTAL_CELLS).fill(false);
        newMines[data.minePos] = true;
        setMinePositions(newMines);
        
        saveGameRecord('lost', data.revealedCount);
        localStorage.removeItem(STORAGE_KEY_STATE);
      } 
      else if (data.status === "won") {
        setGameStatus("won");
        setRevealed(Array(TOTAL_CELLS).fill(true));
        
        const newMines = Array(TOTAL_CELLS).fill(false);
        newMines[data.minePos] = true;
        setMinePositions(newMines);

        saveGameRecord('won', data.revealedCount);
        localStorage.removeItem(STORAGE_KEY_STATE);
      } 
      else {
        // Still playing
        setRevealedCount(data.revealedCount);
        setGameStateToken(data.gameStateToken);
        saveGameRecord('playing', data.revealedCount);
        
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify({
          gameStateToken: data.gameStateToken, // Store the NEW token
          revealed: newRevealed,
          gameStatus: "playing",
          revealedCount: data.revealedCount,
          currentGameId
        }));
      }
    } catch (error) {
      console.error("Move failed:", error);
      alert("网络错误或游戏状态失效, 请重新开始");
      localStorage.removeItem(STORAGE_KEY_STATE);
      initGame();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestartClick = () => {
    if (gameStatus !== "playing" || revealedCount === 0) {
      initGame();
    } else {
      setShowRestartWarning(true);
    }
  };

  const confirmRestart = () => {
    saveGameRecord('incomplete', revealedCount, true);
    localStorage.removeItem(STORAGE_KEY_STATE);
    initGame();
  };

  const cancelRestart = () => {
    setShowRestartWarning(false);
  };

  const getCellContent = (index) => {
    if (!revealed[index]) return "";
    if (minePositions[index]) return "💣";
    return "✓";
  };

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
      cursor: (gameStatus === "playing" && !isProcessing) ? "pointer" : "not-allowed",
      fontSize: GRID_SIZE === 5 ? "24px" : "20px",
      fontWeight: "bold",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: isProcessing && !revealed[index] ? 0.7 : 1,
    };

    if (revealed[index]) {
      if (minePositions[index]) {
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
        <button onClick={onBack} style={styles.backBtn}>← 返回</button>
        <button onClick={handleRestartClick} style={styles.testBtn} disabled={isProcessing}>
          🔄 重新开始
        </button>

        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>零界突破</span>
          </div>
        </div>

        <h1 style={styles.title}>💣 扫雷游戏 ({GRID_SIZE}×{GRID_SIZE})</h1>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            安全格子:{" "}
            <span style={styles.infoNumber}>
              {revealedCount}/{SAFE_CELLS}
            </span>
          </p>
          <p style={styles.ruleText}>找出所有安全格子,若踩到地雷则游戏结束!</p>
          {gameStatus === "playing" && revealedCount > 0 && (
            <p style={styles.autoSaveHint}>💾 进度实时保存中...</p>
          )}
        </div>

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
                : `很遗憾游戏结束! 得分: ${revealedCount}/${SAFE_CELLS}`}
            </p>
          </div>
        )}

        {showRestartWarning && (
          <div style={styles.warningOverlay}>
            <div style={styles.warningBox}>
              <h3 style={styles.warningTitle}>⚠️ 重要提醒</h3>
              <p style={styles.warningText}>
                老板请注意：单子结束前请勿点击重新开始，若不小心在结单前/踩雷前重新开始此游戏，则打完保底结单。
              </p>
              <p style={styles.warningSubtext}>同意则视为接受此条款</p>
              <p style={styles.warningCurrentScore}>当前进度: {revealedCount}/{SAFE_CELLS}</p>
              <div style={styles.warningButtons}>
                <button onClick={confirmRestart} style={styles.confirmBtn}>确认重新开始</button>
                <button onClick={cancelRestart} style={styles.cancelBtn}>取消</button>
              </div>
            </div>
          </div>
        )}

        <div style={{
          ...styles.gridContainer,
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          maxWidth: GRID_SIZE === 5 ? "350px" : "420px",
        }}>
          {Array(TOTAL_CELLS).fill(0).map((_, index) => (
            <div key={index} style={styles.cellWrapper}>
              <button
                onClick={() => handleCellClick(index)}
                style={getCellStyle(index)}
                disabled={gameStatus !== "playing" || revealed[index] || isProcessing}
              >
                {getCellContent(index)}
              </button>
            </div>
          ))}
        </div>

        {gameHistory.length > 0 && (
          <div style={styles.historyContainer}>
            <h3 style={styles.historyTitle}>📊 游戏记录</h3>
            <div style={styles.historyList}>
              {gameHistory.map((record, index) => (
                <div key={index} style={styles.historyItem}>
                  <span style={styles.historyDate}>{record.date} {record.time}</span>
                  <span style={{
                    ...styles.historyResult,
                    color: record.result === '获胜' ? '#059669' : 
                          (record.result === '失败' ? '#dc2626' : 
                          (record.result === '进行中' ? '#2563eb' : '#f59e0b'))
                  }}>
                    {record.result}{record.isManualRestart && ' (中途重开)'}
                  </span>
                  <span style={styles.historyScore}>{record.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.footer}>
          <p style={styles.footerText}>Zero Limit Breakthrough Club - 扫雷挑战</p>
          <p style={styles.hintText}>💣 {GRID_SIZE}×{GRID_SIZE}网格 · 1个地雷 · {SAFE_CELLS}个安全格</p>
        </div>
      </div>
    </div>
  );
};

// ... keep all the exact same CSS styles from your original code at the bottom here
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
  testBtn: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "#ef4444",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
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
  restrictionBox: {
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    border: "2px solid #f59e0b",
  },
  restrictionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#92400e",
    margin: "0 0 8px 0",
  },
  restrictionText: {
    fontSize: "16px",
    color: "#78350f",
    margin: "0 0 4px 0",
    fontWeight: "600",
  },
  restrictionHint: {
    fontSize: "14px",
    color: "#92400e",
    margin: "0",
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
  warningOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  },
  warningBox: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
    border: "3px solid #f59e0b",
  },
  warningTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#92400e",
    margin: "0 0 16px 0",
  },
  warningText: {
    fontSize: "16px",
    color: "#1f2937",
    margin: "0 0 12px 0",
    lineHeight: "1.6",
  },
  warningSubtext: {
    fontSize: "14px",
    color: "#dc2626",
    margin: "0 0 16px 0",
    fontWeight: "bold",
  },
  warningCurrentScore: {
    fontSize: "18px",
    color: "#2563eb",
    margin: "0 0 24px 0",
    fontWeight: "bold",
    padding: "12px",
    background: "#eff6ff",
    borderRadius: "8px",
  },
  warningButtons: {
    display: "flex",
    gap: "12px",
  },
  confirmBtn: {
    flex: 1,
    background: "linear-gradient(45deg, #dc2626, #ef4444)",
    color: "white",
    fontWeight: "bold",
    padding: "14px 24px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
  },
  cancelBtn: {
    flex: 1,
    background: "#6b7280",
    color: "white",
    fontWeight: "bold",
    padding: "14px 24px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(107, 114, 128, 0.3)",
  },
  gridContainer: {
    display: "grid",
    gap: "8px",
    marginBottom: "24px",
    margin: "0 auto 24px auto",
  },
  cellWrapper: {
    width: "100%",
    paddingBottom: "100%",
    position: "relative",
  },
  historyContainer: {
    marginTop: "32px",
    padding: "20px",
    background: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  historyTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 16px 0",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    background: "white",
    borderRadius: "8px",
    fontSize: "14px",
  },
  historyDate: {
    color: "#6b7280",
    fontWeight: "500",
    flex: 1,
  },
  historyResult: {
    fontWeight: "bold",
    marginRight: "12px",
    fontSize: "13px",
  },
  historyScore: {
    color: "#2563eb",
    fontWeight: "600",
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