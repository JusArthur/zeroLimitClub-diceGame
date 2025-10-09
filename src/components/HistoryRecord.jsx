import { useState } from "react";

function HistoryRecord({ history, styles }) {
  const [expanded, setExpanded] = useState(false);

  // 计算显示内容
  const displayList = expanded ? history.slice().reverse() : history.slice(-5).reverse();

  return (
    <>
      {history.length > 0 && (
        <div style={styles.historySection}>
          <h3 style={styles.historyTitle}>
            📊 最近记录（共 {history.length} 条）
          </h3>

          <div style={styles.historyList}>
            {displayList.map((item, idx) => (
              <div key={idx} style={styles.historyItem}>
                <span style={styles.historyTime}>{item.time}</span>
                <span
                  style={{ ...styles.historyResult, color: item.result.color }}
                >
                  {item.result.name}
                </span>
              </div>
            ))}
          </div>

          {/* 展开/收起按钮 */}
          {history.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                marginTop: "8px",
                background: "none",
                border: "none",
                color: "#007bff",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "14px"
              }}
            >
              {expanded ? "收起记录 ▲" : "展开更多 ▼"}
            </button>
          )}
        </div>
      )}
    </>
  );
}

export default HistoryRecord;