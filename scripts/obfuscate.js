// scripts/obfuscate.js
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const buildJsDir = path.resolve(__dirname, '../build/static/js');
const backupDir = path.resolve(__dirname, '../build/static/js_backup_' + Date.now());

// 注入的运行时防护代码（一段尽量简洁的 anti-devtools / 防复制代码）
const protectionSnippet = `(function(){try{
  // 小开关，避免多次注入执行
  if(window.__APP_PROTECTION_ACTIVE) return; window.__APP_PROTECTION_ACTIVE = true;

  // 禁用右键、选择、复制等
  ['contextmenu','selectstart','copy','cut','paste'].forEach(e=>document.addEventListener(e, function(ev){ try{ ev.preventDefault(); }catch(ex){} }, {capture:true}));

  // 拦截常见快捷键（F12, Ctrl/Cmd+Shift+{I,J,C}, Ctrl/Cmd+U）
  document.addEventListener('keydown', function(ev){ try{
    if(ev.keyCode === 123) { ev.preventDefault(); ev.stopPropagation(); return false; } // F12
    const mod = ev.ctrlKey || ev.metaKey;
    if(mod && ev.shiftKey && (ev.keyCode === 73 || ev.keyCode === 74 || ev.keyCode === 67)){ ev.preventDefault(); ev.stopPropagation(); return false; }
    if(mod && ev.keyCode === 85){ ev.preventDefault(); ev.stopPropagation(); return false; }
  }catch(e){} }, {capture:true});

  // 覆盖 console.log 等（可根据需要只覆盖 log）
  try {
    const __origLog = console.log;
    console.log = function(){ /* suppressed */ };
    // 若需要保留 console.error、warn，可不覆盖
    // setTimeout(()=>{ console.log = __origLog; }, 1000); // 如果需要临时恢复，可改这里
  } catch(e){}

  // 简单检测 DevTools: 外部窗口尺寸与内部尺寸差异（常见方法）
  var detect = function(){
    try {
      var threshold = 160;
      var widthDiff = Math.abs(window.outerWidth - window.innerWidth);
      var heightDiff = Math.abs(window.outerHeight - window.innerHeight);
      if(widthDiff > threshold || heightDiff > threshold){
        // 尝试锁定页面（替换内容）
        try {
          document.documentElement.innerHTML = '';
          var el = document.createElement('div');
          el.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100vh;font-size:20px;color:#dc2626';
          el.textContent = '⚠️ 检测到调试/开发者工具，页面已锁定';
          document.body.appendChild(el);
        } catch (e) {}
      }
    } catch(e) {}
  };

  // 周期检测
  setInterval(detect, 1000);
}catch(e){} })();
`;

const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: false, // 若要更强的混淆可设 true（会显著增加体积和运行开销）
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: false,
  deadCodeInjectionThreshold: 0.4,
  // 注意：此处我们仍然保留 disableConsoleOutput: false，因为我们主动注入了覆盖 console 的逻辑
  disableConsoleOutput: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  rotateStringArray: true,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

function abort(msg) {
  console.error('❌', msg);
  process.exit(1);
}

if (!fs.existsSync(buildJsDir) || !fs.statSync(buildJsDir).isDirectory()) {
  abort('build/static/js not found. Please run `npm run build` first.');
}

const files = fs.readdirSync(buildJsDir)
  .filter(f => f.endsWith('.js') && !f.endsWith('.map.js'));

// nothing to do
if (files.length === 0) {
  abort('No .js files found in build/static/js');
}

// create backup
fs.mkdirSync(backupDir, { recursive: true });
files.forEach(f => {
  fs.copyFileSync(path.join(buildJsDir, f), path.join(backupDir, f));
});
console.log(`✅ Backed up ${files.length} JS file(s) to ${path.relative(process.cwd(), backupDir)}`);

files.forEach(file => {
  const filePath = path.join(buildJsDir, file);
  try {
    let code = fs.readFileSync(filePath, 'utf8');

    // 把 protectionSnippet 注入到每个文件顶部（确保立即生效）
    code = protectionSnippet + '\n' + code;

    const obfuscated = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions);
    fs.writeFileSync(filePath, obfuscated.getObfuscatedCode(), 'utf8');

    console.log(`🔐 Obfuscated + injected protection: ${file}`);
  } catch (err) {
    console.error(`❌ Failed to obfuscate ${file}:`, err.message || err);
    // restore from backup if something goes wrong for this file
    try {
      const bak = path.join(backupDir, file);
      if (fs.existsSync(bak)) {
        fs.copyFileSync(bak, path.join(buildJsDir, file));
        console.log(`↩️ Restored original for: ${file}`);
      }
    } catch (restoreErr) {
      console.error('⚠️ Restore failed:', restoreErr.message || restoreErr);
    }
  }
});

console.log('🎉 Obfuscation + protection injection finished. Serve/inspect build to verify functionality.');
console.log(`If anything broken, restore files from backup folder: ${path.relative(process.cwd(), backupDir)}`);
