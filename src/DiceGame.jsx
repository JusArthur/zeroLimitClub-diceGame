import React, { useState, useEffect, useRef } from 'react';
import './DiceGame.css'; // 需要引入CSS文件
import logo from './pic/logo.png'; // 导入本地logo图片

const DiceGame = () => {
  const [step, setStep] = useState('select');
  const [diceCount, setDiceCount] = useState(1);
  const [diceValues, setDiceValues] = useState([]);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    if (step === 'game') {
      setDiceValues(Array(diceCount).fill(1));
    }
  }, [step, diceCount]);

  const rollDice = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    
    // 2.5秒后停止并显示最终结果
    setTimeout(() => {
      const finalValues = Array(diceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
      setDiceValues(finalValues);
      setIsRolling(false);
    }, 2500);
  };

  const goBack = () => {
    setStep('select');
    setDiceValues([]);
    setIsRolling(false);
  };

  const startGame = () => {
    setStep('game');
  };

  if (step === 'select') {
    return (
      <div className="app-container">
        <div className="select-container">
          {/* 俱乐部Logo */}
          <div className="club-logo">
            <img src={logo} alt="零界突破俱乐部" className="logo-image" />
          </div>
          <h1 className="main-title">🎲 中秋庆典-零界突破俱乐部</h1>
          
          <div className="select-section">
            <h2 className="section-title">选择骰子数量</h2>
            <div className="number-grid">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => setDiceCount(num)}
                  className={`number-btn ${diceCount === num ? 'selected' : ''}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="selected-info">
            <p>已选择: {diceCount} 个骰子</p>
          </div>

          <button
            onClick={startGame}
            className="start-btn"
          >
            开始游戏 🎮
          </button>
          
          {/* 俱乐部商标 */}
          <div className="club-trademark">
            <p className="trademark-text">© 2025 零界突破俱乐部 | Zero Limit Breakthrough Club</p>
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
          <button
            onClick={goBack}
            className="back-btn"
          >
            ← 返回
          </button>
          <h1 className="game-title">🎲 中秋庆典-零界突破俱乐部</h1>
          <div className="spacer"></div>
        </div>

        <div className="game-content">
          <p className="dice-count-text">你有 {diceCount} 个骰子</p>
          
          <div className={`dice-area ${diceCount > 3 ? 'large-dice-area' : ''}`}>
            {diceValues.map((value, index) => (
              <Dice3D key={index} value={value} isRolling={isRolling} delay={index * 200} />
            ))}
          </div>
        </div>

        {diceValues.length > 0 && !isRolling && (
          <div className="result-section">
            <p className="total-text">
              总点数: <span className="total-number">{diceValues.reduce((a, b) => a + b, 0)}</span>
            </p>
          </div>
        )}

        <button
          onClick={rollDice}
          disabled={isRolling}
          className={`roll-btn ${isRolling ? 'rolling' : ''}`}
        >
          {isRolling ? '摇骰子中... 🎲' : '摇骰子 🎲'}
        </button>

        {isRolling && (
          <div className="rolling-status">
            <p className="rolling-text">摇骰子中...</p>
          </div>
        )}
        
        {/* 游戏页面底部商标 */}
        <div className="game-footer">
          <p className="footer-text">Zero Limit Breakthrough Club - 中秋庆典特别版</p>
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
      6: [0, 2, 3, 5, 6, 8] // 左右各三个
    };
    return patterns[num] || [];
  };

  const renderFace = (faceValue, faceClass) => (
    <div className={`dice-face ${faceClass}`}>
      <div className="dots-container">
        <div className="dots-grid">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="dot-position"
            >
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
      1: 'rotateX(0deg) rotateY(0deg)',        // 正面
      2: 'rotateX(-90deg) rotateY(0deg)',      // 顶面  
      3: 'rotateX(0deg) rotateY(90deg)',       // 右面
      4: 'rotateX(0deg) rotateY(-90deg)',      // 左面
      5: 'rotateX(90deg) rotateY(0deg)',       // 底面
      6: 'rotateX(0deg) rotateY(180deg)'       // 背面
    };
    return rotations[value] || rotations[1];
  };

  return (
    <div className="dice-container">
      <div
        ref={diceRef}
        className={`dice-cube ${isRolling ? 'cube-rolling' : ''}`}
        style={{
          animationDelay: `${delay}ms`,
          transform: isRolling ? '' : getDiceFinalRotation(value)
        }}
      >
        {renderFace(1, 'face-front')}
        {renderFace(6, 'face-back')}
        {renderFace(3, 'face-right')}
        {renderFace(4, 'face-left')}
        {renderFace(2, 'face-top')}
        {renderFace(5, 'face-bottom')}
      </div>
    </div>
  );
};

export default DiceGame;