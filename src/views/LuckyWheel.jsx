import React, { useState, useEffect, useCallback } from 'react';

const ProtectedLuckyWheel = ({ onBack }) => {
  const [isFlag, setIsFlag] = useState(true);
  const [result, setResult] = useState('');
  const [rotation, setRotation] = useState(0);
  const [remainingTime, setRemainingTime] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);

  // Visual configuration only. Logic is on the backend.
  const prizeConfig = [
    { angle: 0, name: '保底增加488w' },
    { angle: 60, name: '保底增加788w' },
    { angle: 120, name: '288小金单' },
    { angle: 180, name: '388爽吃大保险单' },
    { angle: 240, name: '1111.11现金红包' },
    { angle: 300, name: '非洲之心不出不结单' },
  ];

  const STORAGE_KEY_HISTORY = 'luckywheel_history';
  const STORAGE_KEY_TIME = 'luckywheel_last_spin';

  const loadGameHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (stored) {
        setGameHistory(JSON.parse(stored).slice(0, 10));
      } else {
        setGameHistory([]);
      }
    } catch (e) {
      setGameHistory([]);
    }
  }, []);

  const saveDrawRecord = useCallback((prizeName) => {
    const now = new Date();
    const newRecord = {
      name: prizeName,
      date: now.toLocaleDateString('zh-CN'),
      time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime(),
    };

    let history = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (stored) history = JSON.parse(stored);
    } catch (e) {}

    history.unshift(newRecord);
    const limited = history.slice(0, 10);
    
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(limited));
    setGameHistory(limited);
  }, []);

  const runAnimation = (targetIndex, prizeName) => {
    const middleAngle = prizeConfig[targetIndex].angle + 30;
    let alpha = (270 - middleAngle + 360) % 360;
    const rounds = 5 + Math.floor(Math.random() * 4);
    const totalAngle = rounds * 360 + alpha;
    
    setRotation(totalAngle);
  
    setTimeout(() => {
      setResult(prizeName);
      setIsFlag(true);
      saveDrawRecord(prizeName);
    }, 4000);
  };

  const updateRemaining = () => {
    const lastSpin = localStorage.getItem(STORAGE_KEY_TIME);
    if (lastSpin) {
      const diff = Date.now() - parseInt(lastSpin);
      const lockDuration = 24 * 60 * 60 * 1000; // 24 hours
      if (diff < lockDuration) {
        setRemainingTime(lockDuration - diff);
      } else {
        setRemainingTime(null);
      }
    } else {
      setRemainingTime(null);
    }
  };

  useEffect(() => {
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    loadGameHistory();
    return () => clearInterval(interval);
  }, [loadGameHistory]);

  const handleClick = async () => {
    if (!isFlag || remainingTime !== null) return;
    
    setIsFlag(false);
    
    try {
      // Call backend to determine the prize
      const response = await fetch('/.netlify/functions/spinWheel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Temporary client-side cooldown lock
      localStorage.setItem(STORAGE_KEY_TIME, Date.now().toString());
      updateRemaining();
      
      // Execute UI rotation
      runAnimation(data.index, data.prizeName);

    } catch (error) {
      console.error('抽奖失败:', error);
      alert('服务器连接失败，请稍后再试。');
      setIsFlag(true);
    }
  };

  const colors = ['#77ddff', '#00ddaa', '#ffff33', '#d28eff', '#ffdd55', '#ff88c2'];
  const isLocked = remainingTime !== null;

  let countdownDisplay = null;
  if (isLocked) {
    const hours = Math.floor(remainingTime / 3600000);
    const minutes = Math.floor((remainingTime % 3600000) / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    countdownDisplay = `您每24小时只能玩一次，剩余 ${hours}小时 ${minutes}分 ${seconds}秒`;
  }

  const probabilities = [
    { name: '保底增加488w', prob: 70 },
    { name: '保底增加788w', prob: 24 },
    { name: '288小金单', prob: 4 },
    { name: '388爽吃大保险单', prob: 0.9 },
    { name: '1111.11现金红包', prob: 0.05 },
    { name: '非洲之心不出不结单', prob: 0.05 },
  ];

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      margin: 0, 
      padding: 0,
      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #14b8a6 100%)',
      userSelect: 'none'
    }}>
      <div style={{ 
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        padding: '32px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button 
          onClick={onBack} 
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            fontSize: '14px',
            padding: '4px 8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#1f2937'
          }}
        >
          ← 返回
        </button>
        
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: '0 0 24px 0',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>转盘好礼放送！</h1>

        <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
          <svg
            style={{
              width: '300px',
              height: '300px',
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 4s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
            viewBox="0 0 300 300"
          >
            {prizeConfig.map((config, i) => {
              const startAngle = (config.angle * Math.PI) / 180;
              const endAngle = ((config.angle + 60) * Math.PI) / 180;
              
              const x1 = 150 + 150 * Math.cos(startAngle);
              const y1 = 150 + 150 * Math.sin(startAngle);
              const x2 = 150 + 150 * Math.cos(endAngle);
              const y2 = 150 + 150 * Math.sin(endAngle);

              const largeArc = 0;
              const pathData = `M 150 150 L ${x1} ${y1} A 150 150 0 ${largeArc} 1 ${x2} ${y2} Z`;

              const textAngle = (config.angle + 30) * Math.PI / 180;
              const textX = 150 + 100 * Math.cos(textAngle);
              const textY = 150 + 100 * Math.sin(textAngle);
              const textRotation = config.angle + 30;

              return (
                <g key={i}>
                  <path
                    d={pathData}
                    fill={colors[i]}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#333"
                    transform={`rotate(${textRotation} ${textX} ${textY})`}
                    style={{ pointerEvents: 'none' }}
                  >
                    {config.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '20px solid #fbbf24',
              zIndex: 10,
              filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3))',
            }}
          />

          <div
            onClick={handleClick}
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgb(236, 197, 19)',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '20px',
              color: '#fff',
              cursor: (!isLocked && isFlag) ? 'pointer' : 'not-allowed',
              userSelect: 'none',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(236, 197, 19, 0.5)',
              opacity: (!isLocked && isFlag) ? 1 : 0.7,
              zIndex: 11,
            }}
          >
            抽奖
          </div>
        </div>

        {isLocked && (
          <div style={{
            marginTop: '16px',
            fontSize: '16px',
            color: '#dc2626',
          }}>
            {countdownDisplay}
          </div>
        )}

        {result && (
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
            border: '3px solid #fbbf24',
            borderRadius: '16px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '8px',
            }}>
              🎉 恭喜中奖 🎉
            </div>
            <div style={{
              fontSize: '28px',
              color: '#2563eb',
              fontWeight: 'bold',
              margin: '12px 0'
            }}>
              {result}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            background: '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          查看公示
        </button>

        <div style={{
          marginTop: '32px',
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 16px 0',
            textAlign: 'center'
          }}>开奖记录</h3>

          {gameHistory.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '14px',
              margin: 0
            }}>暂无记录</p>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {gameHistory.map((record, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>
                    {record.date} {record.time}
                  </span>
                  <span style={{
                    color: '#2563eb',
                    fontWeight: '600',
                    maxWidth: '180px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {record.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 20,
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '16px',
            }}>活动公示</h2>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>
              欢迎参与我们的转盘抽奖活动！以下是各奖品的公示概率：
            </p>
            <ul style={{
              listStyleType: 'disc',
              paddingLeft: '20px',
              marginBottom: '20px',
            }}>
              {probabilities.map((item, index) => (
                <li key={index} style={{
                  fontSize: '14px',
                  color: '#1f2937',
                  marginBottom: '8px',
                }}>
                  {item.name}: {item.prob}%
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtectedLuckyWheel;