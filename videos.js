// =====================================================
// 預設資料
// 之後可以直接修改這個檔案，或用網頁上的「建立影片」。
// 網頁建立的資料會先存在 localStorage。
// =====================================================

const seedMembers = [
  { id: "m-ted", name: "Ted", gender: "male" },
  { id: "m-johnny", name: "Johnny", gender: "male" },
  { id: "m-richard", name: "Richard", gender: "male" },
  { id: "m-linliang", name: "林良", gender: "male" }
];

const seedGroups = [
  "第一組",
  "第二組",
  "第三組",
  "第四組",
  "第五組",
  "第六組",
  "第一組 vs 第二組"
];

const seedDrills = [
  {
    id: "d-dump-swing",
    name: "Dump Swing",
    description: "Handler dump 後快速 swing，練習 timing、spacing 與接球後繼續移動。",
    reps: 10
  }
];

const seedVideos = [
  {
    id: "v1",
    title: "4v4 第一組 vs 第二組",
    date: "2026-08-18",
    category: "對抗",
    format: "4v4",
    group: "第一組 vs 第二組",
    memberIds: ["m-ted", "m-johnny", "m-richard", "m-linliang"],
    youtubeId: "M7lc1UVf-VE",
    notes: [
      { time: 32, text: "Johnny open side cut timing 不錯" },
      { time: 77, text: "這裡可以注意 clear 的速度" }
    ]
  },
  {
    id: "v2",
    title: "Dump Swing Drill",
    date: "2026-08-18",
    category: "Drill",
    drillId: "d-dump-swing",
    memberIds: ["m-johnny", "m-ted", "m-linliang"],
    youtubeId: "M7lc1UVf-VE",
    notes: []
  }
];

// 新影片如果只想先丟進待整理區，可以先加在這裡。
const unsortedVideos = [
  {
    id: "u1",
    title: "待整理影片 A",
    date: "2026-08-19",
    youtubeId: "M7lc1UVf-VE"
  },
  {
    id: "u2",
    title: "待整理影片 B",
    date: "2026-08-19",
    youtubeId: "M7lc1UVf-VE"
  }
];
