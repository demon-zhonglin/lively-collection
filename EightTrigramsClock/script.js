const shengxiao = [
  "鼠",
  "牛",
  "虎",
  "兔",
  "龙",
  "蛇",
  "马",
  "羊",
  "猴",
  "鸡",
  "狗",
  "猪",
];
const jieqi = [
  "立春",
  "雨水",
  "惊蛰",
  "春分",
  "清明",
  "谷雨",
  "立夏",
  "小满",
  "芒种",
  "夏至",
  "小暑",
  "大暑",
  "立秋",
  "处暑",
  "白露",
  "秋分",
  "寒露",
  "霜降",
  "立冬",
  "小雪",
  "大雪",
  "冬至",
  "小寒",
  "大寒",
];

const strictBaguaConfig = [
  { text: "離", angle: 0, hourRange: [11, 13] },
  { text: "坤", angle: 45, hourRange: [14, 16] },
  { text: "兌", angle: 90, hourRange: [17, 19] },
  { text: "乾", angle: 135, hourRange: [20, 22] },
  { text: "坎", angle: 180, hourRange: [23, 1] },
  { text: "艮", angle: 225, hourRange: [2, 4] },
  { text: "震", angle: 270, hourRange: [5, 7] },
  { text: "巽", angle: 315, hourRange: [8, 10] },
];

function toChineseNum(num) {
  const zh = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (num <= 10) return zh[num];
  if (num < 20) return "十" + (num % 10 === 0 ? "" : zh[num % 10]);
  const unit = num % 10 === 0 ? "" : zh[num % 10];
  return zh[Math.floor(num / 10)] + "十" + unit;
}

const ringsConfig = [
  {
    id: "zodiac",
    type: "zodiac",
    data: shengxiao.map((s) => s + "年"),
    radius: 8,
  },
  { id: "jieqi", type: "jieqi", data: jieqi, radius: 14 },
  {
    id: "month",
    type: "time",
    data: Array.from({ length: 12 }, (_, i) => toChineseNum(i + 1) + "月"),
    radius: 21,
  },
  {
    id: "day",
    type: "time",
    data: Array.from({ length: 31 }, (_, i) => toChineseNum(i + 1) + "号"),
    radius: 29,
  },
  {
    id: "week",
    type: "time",
    data: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    radius: 37,
  },
  {
    id: "hour",
    type: "time",
    data: Array.from({ length: 24 }, (_, i) => toChineseNum(i) + "点"),
    radius: 45,
  },
  {
    id: "minute",
    type: "time",
    data: Array.from({ length: 60 }, (_, i) => toChineseNum(i) + "分"),
    radius: 54,
  },
  {
    id: "second",
    type: "second",
    data: Array.from({ length: 60 }, (_, i) => toChineseNum(i) + "秒"),
    radius: 64,
  },
];

let state = {};
let bgItemsCache = []; // 缓存背景节点

function initStaticBagua() {
  const bg = document.getElementById("bg-bagua");
  const radius = 35;

  strictBaguaConfig.forEach((conf) => {
    const item = document.createElement("div");
    item.className = "bg-item";
    item.innerText = conf.text;

    const rad = conf.angle * (Math.PI / 180);
    const x = radius * Math.sin(rad);
    const y = -radius * Math.cos(rad);

    item.style.left = `calc(50% + ${x}vmin)`;
    item.style.top = `calc(50% + ${y}vmin)`;

    bg.appendChild(item);
    bgItemsCache.push(item); // 存入缓存
  });
}

function initRings() {
  const container = document.getElementById("clock-container");
  ringsConfig.forEach((conf) => {
    const el = document.createElement("div");
    el.className = `ring ring-${conf.type}`;
    el.id = conf.id;

    const step = 360 / conf.data.length;
    const itemsCache = []; // 缓存当前环的所有子节点

    conf.data.forEach((txt, i) => {
      const item = document.createElement("div");
      item.className = "item";
      item.innerText = txt;
      item.style.transform = `rotate(${i * step}deg) translateX(${
        conf.radius
      }vmin)`;
      el.appendChild(item);
      itemsCache.push(item);
    });
    container.appendChild(el);

    // 性能优化: 将 DOM 节点引用直接存入 state, 避免 update 时的重绘计算
    state[conf.id] = {
      element: el,
      items: itemsCache,
      angle: 0,
      lastIdx: -1,
    };
  });
}

function update() {
  const now = new Date();
  const hour = now.getHours();

  // 背景高亮更新 (使用缓存)
  bgItemsCache.forEach((item, i) => {
    const conf = strictBaguaConfig[i];
    let active = false;
    if (conf.hourRange[0] > conf.hourRange[1]) {
      active = hour >= conf.hourRange[0] || hour <= conf.hourRange[1];
    } else {
      active = hour >= conf.hourRange[0] && hour <= conf.hourRange[1];
    }
    item.classList.toggle("active", active);
  });

  const vals = {
    zodiac: (now.getFullYear() - 4) % 12,
    jieqi: Math.floor(now.getMonth() * 2 + (now.getDate() > 15 ? 1 : 0)) % 24,
    month: now.getMonth(),
    day: now.getDate() - 1,
    week: now.getDay(),
    hour: hour,
    minute: now.getMinutes(),
    second: now.getSeconds(),
  };

  ringsConfig.forEach((conf) => {
    updateRingRotation(conf.id, vals[conf.id], conf.data.length);
  });
}

// 性能优化: 移除了 querySelectorAll 带来的开销
function updateRingRotation(id, currentIdx, total) {
  const s = state[id];
  if (currentIdx !== s.lastIdx) {
    let diff = currentIdx - s.lastIdx;
    if (s.lastIdx !== -1 && diff < 0) diff += total;
    if (s.lastIdx === -1) diff = currentIdx;

    s.angle -= diff * (360 / total);
    s.element.style.transform = `rotate(${s.angle}deg)`;

    if (s.lastIdx !== -1) {
      s.items[s.lastIdx].classList.remove("active");
    }
    s.items[currentIdx].classList.add("active");
    s.lastIdx = currentIdx;
  }
}

window.onload = () => {
  initStaticBagua();
  initRings();
  update();
  setInterval(update, 1000);
};
