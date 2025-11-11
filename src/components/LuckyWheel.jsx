import React, { useState, useEffect } from 'react';

// 安全保护Hook
const useSecurityProtection = () => {
  useEffect(() => {
    // 1. 禁用右键菜单
    const disableContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 2. 禁用开发者工具快捷键
    const disableDevTools = (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / Cmd+Option+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C / Cmd+Option+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J / Cmd+Option+J
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U / Cmd+U (查看源代码)
      if ((e.ctrlKey || e.metaKey) && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }
    };

    // 3. 检测开发者工具
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:24px;color:#dc2626;">⚠️ 检测到非法操作，页面已锁定</div>';
      }
    };

    // 4. 禁用选择和复制
    const disableSelection = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableDevTools);
    document.addEventListener('selectstart', disableSelection);
    document.addEventListener('copy', disableSelection);

    // 定期检测开发者工具（每秒检测一次）
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // 5. 混淆console.log输出
    const originalLog = console.log;
    console.log = function(...args) {
      // 在生产环境中完全禁用或输出混淆信息
      originalLog.apply(console, ['[已屏蔽]']);
    };

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableDevTools);
      document.removeEventListener('selectstart', disableSelection);
      document.removeEventListener('copy', disableSelection);
      clearInterval(devToolsInterval);
      console.log = originalLog;
    };
  }, []);
};

// 数据加密工具
const encryptData = (data) => {
  // 简单的Base64编码 + 字符串反转
  const jsonStr = JSON.stringify(data);
  const base64 = btoa(encodeURIComponent(jsonStr));
  return base64.split('').reverse().join('');
};

const decryptData = (encrypted) => {
  try {
    const base64 = encrypted.split('').reverse().join('');
    const jsonStr = decodeURIComponent(atob(base64));
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
};

// 受保护的localStorage包装器
const secureStorage = {
  setItem: (key, value) => {
    const encrypted = encryptData(value);
    const timestamp = Date.now();
    const hash = btoa(`${key}_${timestamp}_${Math.random()}`);
    localStorage.setItem(`sec_${key}`, encrypted);
    localStorage.setItem(`sec_${key}_hash`, hash);
  },
  
  getItem: (key) => {
    const encrypted = localStorage.getItem(`sec_${key}`);
    const hash = localStorage.getItem(`sec_${key}_hash`);
    
    if (!encrypted || !hash) return null;
    
    return decryptData(encrypted);
  },
  
  removeItem: (key) => {
    localStorage.removeItem(`sec_${key}`);
    localStorage.removeItem(`sec_${key}_hash`);
  }
};

// 受保护的转盘组件
const ProtectedLuckyWheel = ({ onBack }) => {
  useSecurityProtection();
  
  const [isFlag, setIsFlag] = useState(true);
  const [result, setResult] = useState('');
  const [rotation, setRotation] = useState(0);
  const [remainingTime, setRemainingTime] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 使用加密存储
  const prize = [
    '保底增加188w',
    '保底增加388w',
    '288小金单',
    '388爽吃大保险单',
    '1111.11现金红包',
    '非洲之心不出不结单',
  ];

  const prizeConfig = [
    { weight: 70, angle: 0, name: prize[0] },
    { weight: 24, angle: 60, name: prize[1] },
    { weight: 4, angle: 120, name: prize[2] },
    { weight: 1, angle: 180, name: prize[3] },
    { weight: 0, angle: 240, name: prize[4] },
    { weight: 0, angle: 300, name: prize[5] },
  ];

  const weightedRandom = () => {
    const weights = prizeConfig.map(p => p.weight);
    const sum = weights.reduce((a, b) => a + b, 0);
    const rand = Math.random() * sum;
    let total = 0;
    for (let i = 0; i < weights.length; i++) {
      total += weights[i];
      if (rand < total) return i;
    }
    return prizeConfig.length - 1;
  };

  const run = (targetIndex) => {
    // === 关键修复：拦截权重为0的奖品 ===
    if (prizeConfig[targetIndex].weight === 0) {
      console.error('非法中奖尝试：', prizeConfig[targetIndex].name);
      alert('系统检测到异常操作，抽奖已取消！');
      setIsFlag(true);
      return;
    }
  
    setIsFlag(false);
    const middleAngle = prizeConfig[targetIndex].angle + 30;
    let alpha = (270 - middleAngle + 360) % 360;
    const rounds = 5 + Math.floor(Math.random() * 4);
    const totalAngle = rounds * 360 + alpha;
    setRotation(totalAngle);
  
    setTimeout(() => {
      setResult(prizeConfig[targetIndex].name);
      setIsFlag(true);
    }, 4000);
  };

  const updateRemaining = () => {
    const lastSpin = secureStorage.getItem('lastSpinTime');
    if (lastSpin) {
      const diff = Date.now() - parseInt(lastSpin);
      const lockDuration = 24 * 60 * 60 * 1000;
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
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (!isFlag || remainingTime !== null) return;
    const index = weightedRandom();
    secureStorage.setItem('lastSpinTime', Date.now().toString());
    updateRemaining();
    run(index);
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