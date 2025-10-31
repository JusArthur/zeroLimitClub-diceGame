import React, { useState, useEffect, useCallback } from "react";

const MinesweeperGame = ({ onBack, gridSize = 7 }) => {
  const GRID_SIZE = gridSize;
  const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
  const MINE_COUNT = 1;
  const SAFE_CELLS = TOTAL_CELLS - MINE_COUNT;

  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [gameStatus, setGameStatus] = useState("playing");
  const [revealedCount, setRevealedCount] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [canPlay, setCanPlay] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showRestartWarning, setShowRestartWarning] = useState(false);

  // 存储键名根据网格大小区分
  const STORAGE_KEY_PLAY = `minesweeper_last_play_${GRID_SIZE}x${GRID_SIZE}`;
  const STORAGE_KEY_HISTORY = `minesweeper_history_${GRID_SIZE}x${GRID_SIZE}`;

  // 检查是否可以玩游戏
  const checkPlayPermission = useCallback(() => {
    const lastPlayTime = localStorage.getItem(STORAGE_KEY_PLAY);
    if (!lastPlayTime) {
      return { canPlay: true, timeRemaining: null };
    }

    const lastPlay = new Date(parseInt(lastPlayTime));
    const now = new Date();
    const timeDiff = now - lastPlay;
    const hoursRemaining = 24 - (timeDiff / (1000 * 60 * 60));

    if (hoursRemaining > 0) {
      return { 
        canPlay: false, 
        timeRemaining: Math.ceil(hoursRemaining * 60) // 转换为分钟
      };
    }

    return { canPlay: true, timeRemaining: null };
  }, [STORAGE_KEY_PLAY]);

  // 加载游戏历史
  const loadGameHistory = useCallback(() => {
    const history = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (history) {
      try {
        setGameHistory(JSON.parse(history));
      } catch (e) {
        setGameHistory([]);
      }
    }
  }, [STORAGE_KEY_HISTORY]);

  // 保存游戏记录
  const saveGameRecord = useCallback((status, score, isManualRestart = false) => {
    const now = new Date();
    const record = {
      date: now.toLocaleDateString('zh-CN'),
      time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      result: status === 'won' ? '获胜' : (status === 'lost' ? '失败' : '未完成'),
      score: `${score}/${SAFE_CELLS}`,
      timestamp: now.getTime(),
      isManualRestart: isManualRestart
    };

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
    history.unshift(record);
    
    // 只保留最近10条记录
    const limitedHistory = history.slice(0, 10);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(limitedHistory));
    setGameHistory(limitedHistory);

    // 只有在踩雷失败时才设置24小时限制
    if (status === 'lost') {
      localStorage.setItem(STORAGE_KEY_PLAY, now.getTime().toString());
      setCanPlay(false);
      setTimeRemaining(24 * 60); // 24小时转分钟
    }
    // 获胜时也设置限制
    else if (status === 'won') {
      localStorage.setItem(STORAGE_KEY_PLAY, now.getTime().toString());
      setCanPlay(false);
      setTimeRemaining(24 * 60);
    }
    // 未完成(中途重开)不设置限制
  }, [SAFE_CELLS, STORAGE_KEY_HISTORY, STORAGE_KEY_PLAY]);

  // 初始化游戏
  const initGame = useCallback((forceRestart = false) => {
    if (!forceRestart) {
      const permission = checkPlayPermission();
      
      if (!permission.canPlay) {
        setCanPlay(false);
        setTimeRemaining(permission.timeRemaining);
        return;
      }
    }

    const minePos = Math.floor(Math.random() * TOTAL_CELLS);

    const newGrid = Array(TOTAL_CELLS).fill(false);
    newGrid[minePos] = true;
    setGrid(newGrid);

    setRevealed(Array(TOTAL_CELLS).fill(false));
    setGameStatus("playing");
    setRevealedCount(0);
    setShowRestartWarning(false);
    if (forceRestart) {
      setCanPlay(true);
    }
  }, [TOTAL_CELLS, checkPlayPermission]);

  useEffect(() => {
    loadGameHistory();
    const permission = checkPlayPermission();
    if (permission.canPlay) {
      initGame();
    } else {
      setCanPlay(false);
      setTimeRemaining(permission.timeRemaining);
    }
  }, [initGame, loadGameHistory, checkPlayPermission]);

  // 倒计时更新
  useEffect(() => {
    if (!canPlay && timeRemaining > 0) {
      const timer = setInterval(() => {
        const permission = checkPlayPermission();
        if (permission.canPlay) {
          setCanPlay(true);
          setTimeRemaining(null);
        } else {
          setTimeRemaining(permission.timeRemaining);
        }
      }, 60000); // 每分钟更新一次

      return () => clearInterval(timer);
    }
  }, [canPlay, timeRemaining, checkPlayPermission]);

  // 处理点击格子
  const handleCellClick = (index) => {
    if (gameStatus !== "playing" || revealed[index] || !canPlay) return;

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (grid[index]) {
      // 踩到地雷
      setGameStatus("lost");
      setRevealed(Array(TOTAL_CELLS).fill(true));
      saveGameRecord('lost', revealedCount);
    } else {
      // 安全格子
      const newCount = revealedCount + 1;
      setRevealedCount(newCount);

      if (newCount === SAFE_CELLS) {
        setGameStatus("won");
        setRevealed(Array(TOTAL_CELLS).fill(true));
        saveGameRecord('won', newCount);
      }
    }
  };

  // 处理重新开始按钮点击
  const handleRestartClick = () => {
    // 如果已经被限制（踩雷或获胜后），不能重新开始
    if (!canPlay) {
      return;
    }
    
    // 如果游戏已经结束或者还没开始玩，直接重新开始
    if (gameStatus !== "playing" || revealedCount === 0) {
      initGame(true);
    } else {
      // 游戏进行中，显示警告
      setShowRestartWarning(true);
    }
  };

  // 确认重新开始
  const confirmRestart = () => {
    // 保存当前未完成的游戏记录
    saveGameRecord('incomplete', revealedCount, true);
    // 清除上次游玩时间限制,允许重新开始
    localStorage.removeItem(STORAGE_KEY_PLAY);
    // 重新开始游戏
    initGame(true);
  };

  // 取消重新开始
  const cancelRestart = () => {
    setShowRestartWarning(false);
  };

  // 测试用：重置时间限制
  const resetTimeLimit = () => {
    if (window.confirm('测试功能：确认重置24小时限制？')) {
      localStorage.removeItem(STORAGE_KEY_PLAY);
      setCanPlay(true);
      setTimeRemaining(null);
      alert('时间限制已重置！');
    }
  };

  // 格子内容
  const getCellContent = (index) => {
    if (!revealed[index]) return "";
    if (grid[index]) return "💣";
    return "✓";
  };

  // 格子样式
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
      cursor: canPlay && gameStatus === "playing" ? "pointer" : "not-allowed",
      fontSize: GRID_SIZE === 5 ? "24px" : "20px",
      fontWeight: "bold",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: canPlay ? 1 : 0.5,
    };

    if (revealed[index]) {
      if (grid[index]) {
        return {
          ...baseStyle,
          border: "2px solid #ef4444",
          background: "linear-gradient(135deg, #fee2e2, #fecaca)",
          cursor: "default",
          opacity: 1,
        };
      } else {
        return {
          ...baseStyle,
          border: "2px solid #22c55e",
          background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
          color: "#065f46",
          cursor: "default",
          opacity: 1,
        };
      }
    }

    return baseStyle;
  };

  // 格式化剩余时间
  const formatTimeRemaining = () => {
    if (!timeRemaining) return "";
    const hours = Math.floor(timeRemaining / 60);
    const minutes = timeRemaining % 60;
    return `${hours}小时${minutes}分钟`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.gameBox}>
        {/* 返回按钮 */}
        <button onClick={onBack} style={styles.backBtn}>
          ← 返回
        </button>

        {/* 测试按钮 */}
        <button onClick={resetTimeLimit} style={styles.testBtn}>
          🔧 测试重置
        </button>

        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            <span style={styles.logoText}>零界突破</span>
          </div>
        </div>

        <h1 style={styles.title}>💣 扫雷游戏 ({GRID_SIZE}×{GRID_SIZE})</h1>

        {/* 游戏限制提示 */}
        {!canPlay && (
          <div style={styles.restrictionBox}>
            <h3 style={styles.restrictionTitle}>⏰ 今日游戏次数已用完</h3>
            <p style={styles.restrictionText}>
              剩余时间: {formatTimeRemaining()}
            </p>
            <p style={styles.restrictionHint}>每24小时只能玩一次哦!</p>
          </div>
        )}

        {/* 游戏信息 */}
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            安全格子:{" "}
            <span style={styles.infoNumber}>
              {revealedCount}/{SAFE_CELLS}
            </span>
          </p>
          <p style={styles.ruleText}>找出所有安全格子,若踩到地雷则游戏结束!</p>
        </div>

        {/* 游戏结果 */}
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

        {/* 重新开始警告弹窗 */}
        {showRestartWarning && (
          <div style={styles.warningOverlay}>
            <div style={styles.warningBox}>
              <h3 style={styles.warningTitle}>⚠️ 重要提醒</h3>
              <p style={styles.warningText}>
                老板请注意：单子结束前请勿点击重新开始，若不小心在结单前/踩雷前重新开始此游戏，则打完保底结单。
              </p>
              <p style={styles.warningSubtext}>
                同意则视为接受此条款
              </p>
              <p style={styles.warningCurrentScore}>
                当前进度: {revealedCount}/{SAFE_CELLS}
              </p>
              <div style={styles.warningButtons}>
                <button onClick={confirmRestart} style={styles.confirmBtn}>
                  确认重新开始
                </button>
                <button onClick={cancelRestart} style={styles.cancelBtn}>
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 游戏网格 */}
        <div style={{
          ...styles.gridContainer,
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          maxWidth: GRID_SIZE === 5 ? "350px" : "420px",
        }}>
          {grid.map((_, index) => (
            <div key={index} style={styles.cellWrapper}>
              <button
                onClick={() => handleCellClick(index)}
                style={getCellStyle(index)}
                disabled={gameStatus !== "playing" || revealed[index] || !canPlay}
              >
                {getCellContent(index)}
              </button>
            </div>
          ))}
        </div>

        {/* 重新开始按钮 */}
        <button 
          onClick={handleRestartClick}
          style={{
            ...styles.restartBtn,
            opacity: canPlay ? 1 : 0.5,
            cursor: canPlay ? 'pointer' : 'not-allowed'
          }}
          disabled={!canPlay}
        >
          🔄 重新开始
        </button>

        {/* 游戏历史记录 */}
        {gameHistory.length > 0 && (
          <div style={styles.historyContainer}>
            <h3 style={styles.historyTitle}>📊 游戏记录</h3>
            <div style={styles.historyList}>
              {gameHistory.map((record, index) => (
                <div key={index} style={styles.historyItem}>
                  <span style={styles.historyDate}>
                    {record.date} {record.time}
                  </span>
                  <span style={{
                    ...styles.historyResult,
                    color: record.result === '获胜' ? '#059669' : (record.result === '失败' ? '#dc2626' : '#f59e0b')
                  }}>
                    {record.result}
                    {record.isManualRestart && ' (中途重开)'}
                  </span>
                  <span style={styles.historyScore}>{record.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Zero Limit Breakthrough Club - 扫雷挑战
          </p>
          <p style={styles.hintText}>
            💣 {GRID_SIZE}×{GRID_SIZE}网格 · 1个地雷 · {SAFE_CELLS}个安全格 · 每日一次
          </p>
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