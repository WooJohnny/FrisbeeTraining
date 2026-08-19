const STORAGE_KEYS = {
  members: "frisbeeTraining_members_v3",
  groups: "frisbeeTraining_groups_v3",
  drills: "frisbeeTraining_drills_v3",
  videos: "frisbeeTraining_videos_v3"
};

const $ = id => document.getElementById(id);

const openCreatorButton = $("openCreatorButton");
const closeCreatorButton = $("closeCreatorButton");
const creatorPanel = $("creatorPanel");

const videoForm = $("videoForm");
const youtubeUrl = $("youtubeUrl");
const videoDate = $("videoDate");
const videoTitle = $("videoTitle");
const categorySelect = $("categorySelect");
const memberPicker = $("memberPicker");
const newMemberName = $("newMemberName");
const newMemberGender = $("newMemberGender");
const addMemberButton = $("addMemberButton");
const memberMessage = $("memberMessage");

const scrimmageFields = $("scrimmageFields");
const formatSelect = $("formatSelect");
const groupSelect = $("groupSelect");
const newGroupName = $("newGroupName");
const addGroupButton = $("addGroupButton");
const groupMessage = $("groupMessage");

const drillFields = $("drillFields");
const drillSelect = $("drillSelect");
const newDrillFields = $("newDrillFields");
const newDrillName = $("newDrillName");
const newDrillDescription = $("newDrillDescription");
const newDrillReps = $("newDrillReps");
const drillMessage = $("drillMessage");

const sourceUnsortedId = $("sourceUnsortedId");
const cancelOrganizeButton = $("cancelOrganizeButton");
const videoFormMessage = $("videoFormMessage");

const unsortedGrid = $("unsortedGrid");
const unsortedCount = $("unsortedCount");
const unsortedEmpty = $("unsortedEmpty");

const categoryFilter = $("categoryFilter");
const formatFilter = $("formatFilter");
const groupFilter = $("groupFilter");
const playerFilter = $("playerFilter");
const dateFilter = $("dateFilter");
const searchInput = $("searchInput");
const resetFilters = $("resetFilters");
const videoGrid = $("videoGrid");
const emptyState = $("emptyState");
const resultCount = $("resultCount");

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let members = loadJSON(STORAGE_KEYS.members, [...seedMembers]);
let groups = loadJSON(STORAGE_KEYS.groups, [...seedGroups]);
let drills = loadJSON(STORAGE_KEYS.drills, [...seedDrills]);
let createdVideos = loadJSON(STORAGE_KEYS.videos, []);

function allVideos() {
  return [...seedVideos, ...createdVideos];
}

function uniqueStrings(items) {
  return [...new Set(items.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant", { numeric: true })
  );
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function extractYouTubeId(input) {
  const value = input.trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) {
        return parts[1] || null;
      }
    }
  } catch {}

  return null;
}

function getEmbedUrl(videoId, start = 0) {
  const query = start > 0 ? `?start=${start}&autoplay=1` : "";
  return `https://www.youtube.com/embed/${videoId}${query}`;
}

function watchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function getMember(memberId) {
  return members.find(member => member.id === memberId);
}

function getDrill(drillId) {
  return drills.find(drill => drill.id === drillId);
}

function memberClass(member) {
  return member?.gender === "female" ? "female" : "male";
}

function renderMemberPicker(selectedIds = null) {
  const selected = selectedIds
    ? new Set(selectedIds)
    : new Set(
        [...memberPicker.querySelectorAll('input[type="checkbox"]:checked')]
          .map(input => input.value)
      );

  memberPicker.innerHTML = members
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
    .map(member => `
      <label class="member-option ${memberClass(member)}">
        <input
          type="checkbox"
          value="${escapeHTML(member.id)}"
          ${selected.has(member.id) ? "checked" : ""}
        />
        <span>${escapeHTML(member.name)}</span>
      </label>
    `)
    .join("");
}

function renderGroupOptions() {
  const current = groupSelect.value;
  groupSelect.innerHTML = `
    <option value="">請選擇</option>
    ${uniqueStrings(groups).map(group =>
      `<option value="${escapeHTML(group)}">${escapeHTML(group)}</option>`
    ).join("")}
  `;
  if ([...groupSelect.options].some(option => option.value === current)) {
    groupSelect.value = current;
  }
}

function renderDrillOptions() {
  const current = drillSelect.value;

  drillSelect.innerHTML = `
    <option value="">請選擇</option>
    ${drills
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
      .map(drill =>
        `<option value="${escapeHTML(drill.id)}">${escapeHTML(drill.name)}</option>`
      )
      .join("")}
    <option value="__new__">＋ 建立新 Drill</option>
  `;

  if ([...drillSelect.options].some(option => option.value === current)) {
    drillSelect.value = current;
  }
}

function setCategoryFields() {
  const category = categorySelect.value;

  scrimmageFields.hidden = category !== "對抗";
  drillFields.hidden = category !== "Drill";

  if (category !== "Drill") {
    newDrillFields.hidden = true;
  } else {
    newDrillFields.hidden = drillSelect.value !== "__new__";
  }
}

function addMember() {
  memberMessage.textContent = "";
  const name = newMemberName.value.trim();
  const gender = newMemberGender.value;

  if (!name || !gender) {
    memberMessage.textContent = "新增成員時，名字與性別都要填。";
    return;
  }

  const existing = members.find(
    member => member.name.toLowerCase() === name.toLowerCase()
  );

  if (existing) {
    memberMessage.textContent = "這個名字已經存在，可以直接從上方選擇。";
    renderMemberPicker([existing.id]);
    return;
  }

  const newMember = {
    id: makeId("member"),
    name,
    gender
  };

  members.push(newMember);
  saveJSON(STORAGE_KEYS.members, members);

  const selectedIds = [
    ...memberPicker.querySelectorAll('input[type="checkbox"]:checked')
  ].map(input => input.value);

  selectedIds.push(newMember.id);
  renderMemberPicker(selectedIds);
  rebuildFilters();

  newMemberName.value = "";
  newMemberGender.value = "";
  memberMessage.textContent = `已新增 ${name}。`;
  memberMessage.classList.add("success-message");
}

function addGroup() {
  groupMessage.textContent = "";
  const value = newGroupName.value.trim();

  if (!value) {
    groupMessage.textContent = "請輸入組別或對戰名稱。";
    return;
  }

  if (!groups.some(group => group.toLowerCase() === value.toLowerCase())) {
    groups.push(value);
    saveJSON(STORAGE_KEYS.groups, groups);
  }

  renderGroupOptions();
  groupSelect.value = value;
  newGroupName.value = "";
  groupMessage.textContent = `已新增 ${value}。`;
  groupMessage.classList.add("success-message");
  rebuildFilters();
}

function validateDrillAndMaybeCreate() {
  drillMessage.textContent = "";

  if (drillSelect.value && drillSelect.value !== "__new__") {
    return drillSelect.value;
  }

  if (drillSelect.value !== "__new__") {
    drillMessage.textContent = "請選擇 Drill。";
    return null;
  }

  const name = newDrillName.value.trim();
  const description = newDrillDescription.value.trim();
  const reps = Number(newDrillReps.value);

  if (!name || !description || !Number.isInteger(reps) || reps < 1) {
    drillMessage.textContent = "建立新 Drill 時，名字、描述與 Drill 次數都要填。";
    return null;
  }

  const existing = drills.find(
    drill => drill.name.toLowerCase() === name.toLowerCase()
  );

  if (existing) {
    drillSelect.value = existing.id;
    return existing.id;
  }

  const newDrill = {
    id: makeId("drill"),
    name,
    description,
    reps
  };

  drills.push(newDrill);
  saveJSON(STORAGE_KEYS.drills, drills);
  renderDrillOptions();
  drillSelect.value = newDrill.id;

  return newDrill.id;
}

function buildAutoTitle(category, values) {
  if (category === "對抗") {
    return `${values.format} ${values.group}`;
  }

  if (category === "Drill") {
    const drill = getDrill(values.drillId);
    return drill?.name || "Drill";
  }

  return "體能訓練";
}

function resetVideoForm() {
  videoForm.reset();
  sourceUnsortedId.value = "";
  cancelOrganizeButton.hidden = true;
  videoFormMessage.textContent = "";
  memberMessage.textContent = "";
  groupMessage.textContent = "";
  drillMessage.textContent = "";
  memberMessage.classList.remove("success-message");
  groupMessage.classList.remove("success-message");

  videoDate.value = new Date().toLocaleDateString("en-CA");
  renderMemberPicker([]);
  renderGroupOptions();
  renderDrillOptions();
  setCategoryFields();
}

function handleVideoSubmit(event) {
  event.preventDefault();
  videoFormMessage.textContent = "";

  const youtubeId = extractYouTubeId(youtubeUrl.value);
  const date = videoDate.value;
  const category = categorySelect.value;
  const memberIds = [
    ...memberPicker.querySelectorAll('input[type="checkbox"]:checked')
  ].map(input => input.value);

  if (!youtubeId) {
    videoFormMessage.textContent = "YouTube 連結格式看起來不正確。";
    return;
  }

  if (!date || !category) {
    videoFormMessage.textContent = "請填日期並選擇類別。";
    return;
  }

  if (memberIds.length === 0) {
    videoFormMessage.textContent = "請至少選一位成員。";
    return;
  }

  const video = {
    id: makeId("video"),
    sourceUnsortedId: sourceUnsortedId.value || null,
    date,
    category,
    memberIds,
    youtubeId,
    notes: []
  };

  if (category === "對抗") {
    if (!formatSelect.value || !groupSelect.value) {
      videoFormMessage.textContent = "對抗影片要選擇對抗形式與組別。";
      return;
    }

    video.format = formatSelect.value;
    video.group = groupSelect.value;
  }

  if (category === "Drill") {
    const drillId = validateDrillAndMaybeCreate();
    if (!drillId) return;
    video.drillId = drillId;
  }

  video.title =
    videoTitle.value.trim() ||
    buildAutoTitle(category, video);

  createdVideos.push(video);
  saveJSON(STORAGE_KEYS.videos, createdVideos);

  resetVideoForm();
  renderUnsorted();
  rebuildFilters();
  renderVideos();
  creatorPanel.hidden = true;
  openCreatorButton.hidden = false;
}

function remainingUnsortedVideos() {
  const used = new Set(
    createdVideos
      .map(video => video.sourceUnsortedId)
      .filter(Boolean)
  );

  return unsortedVideos.filter(video => !used.has(video.id));
}

function openCreator() {
  creatorPanel.hidden = false;
  openCreatorButton.hidden = true;
}

function closeCreator() {
  creatorPanel.hidden = true;
  openCreatorButton.hidden = false;
  resetVideoForm();
}

function organizeUnsorted(video) {
  openCreator();
  resetVideoForm();
  sourceUnsortedId.value = video.id;
  youtubeUrl.value = watchUrl(video.youtubeId);
  videoDate.value = video.date;
  videoTitle.value = video.title;
  cancelOrganizeButton.hidden = false;

  $("creatorPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderUnsorted() {
  const remaining = remainingUnsortedVideos();
  unsortedGrid.innerHTML = "";

  remaining.forEach(video => {
    const card = document.createElement("article");
    card.className = "unsorted-card";

    card.innerHTML = `
      <iframe
        class="video-frame"
        src="${getEmbedUrl(video.youtubeId)}"
        title="${escapeHTML(video.title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
      <div class="unsorted-body">
        <h3>${escapeHTML(video.title)}</h3>
        <p class="unsorted-date">${formatDate(video.date)}</p>
        <div class="unsorted-actions">
          <button class="organize-button" type="button">整理這支影片</button>
        </div>
      </div>
    `;

    card.querySelector(".organize-button").addEventListener("click", () => {
      organizeUnsorted(video);
    });

    unsortedGrid.appendChild(card);
  });

  unsortedCount.textContent = `${remaining.length} 支待整理`;
  unsortedGrid.hidden = remaining.length === 0;
  unsortedEmpty.hidden = remaining.length !== 0;
}

function badgeClass(category) {
  if (category === "Drill") return "drill";
  if (category === "體能") return "fitness";
  return "";
}

function renderVideoCard(video) {
  const article = document.createElement("article");
  article.className = "video-card";

  const drill = video.drillId ? getDrill(video.drillId) : null;
  const videoMembers = (video.memberIds || [])
    .map(getMember)
    .filter(Boolean);

  const extraBadges = [
    video.format ? `<span class="badge neutral">${escapeHTML(video.format)}</span>` : "",
    video.group ? `<span class="badge neutral">${escapeHTML(video.group)}</span>` : ""
  ].join("");

  const drillBox = drill
    ? `
      <div class="detail-box">
        <strong>${escapeHTML(drill.name)}</strong>
        <p>${escapeHTML(drill.description)}</p>
        <p class="detail-line">Drill 次數：${escapeHTML(drill.reps)}</p>
      </div>
    `
    : "";

  article.innerHTML = `
    <iframe
      class="video-frame"
      src="${getEmbedUrl(video.youtubeId)}"
      title="${escapeHTML(video.title)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>

    <div class="card-body">
      <div class="card-meta">
        <span class="badge ${badgeClass(video.category)}">${escapeHTML(video.category)}</span>
        ${extraBadges}
      </div>

      <h3 class="card-title">${escapeHTML(video.title)}</h3>
      <p class="card-date">${formatDate(video.date)}</p>

      <div class="player-list">
        ${videoMembers
          .map(member => `
            <button
              class="player-tag ${memberClass(member)}"
              type="button"
              data-player-id="${escapeHTML(member.id)}"
            >
              ${escapeHTML(member.name)}
            </button>
          `)
          .join("")}
      </div>

      ${drillBox}

      <div class="notes-holder"></div>
    </div>
  `;

  const iframe = article.querySelector("iframe");
  const notesHolder = article.querySelector(".notes-holder");

  if (!video.notes || video.notes.length === 0) {
    notesHolder.innerHTML = `<p class="no-notes">目前沒有註解。</p>`;
  } else {
    const list = document.createElement("ul");
    list.className = "notes";

    video.notes.forEach(note => {
      const li = document.createElement("li");
      li.innerHTML = `
        <button class="timestamp" type="button">${formatTime(note.time)}</button>
        <span>${escapeHTML(note.text)}</span>
      `;

      li.querySelector(".timestamp").addEventListener("click", () => {
        iframe.src = getEmbedUrl(video.youtubeId, note.time);
      });

      list.appendChild(li);
    });

    notesHolder.appendChild(list);
  }

  article.querySelectorAll(".player-tag").forEach(button => {
    button.addEventListener("click", () => {
      playerFilter.value = button.dataset.playerId;
      renderVideos();
    });
  });

  return article;
}

function rebuildFilters() {
  const currentGroup = groupFilter.value || "all";
  const currentPlayer = playerFilter.value || "all";
  const currentDate = dateFilter.value || "all";

  groupFilter.innerHTML = `<option value="all">全部</option>`;
  uniqueStrings([
    ...groups,
    ...allVideos().map(video => video.group)
  ]).forEach(group => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    groupFilter.appendChild(option);
  });

  if ([...groupFilter.options].some(option => option.value === currentGroup)) {
    groupFilter.value = currentGroup;
  }

  playerFilter.innerHTML = `<option value="all">全部</option>`;
  members
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
    .forEach(member => {
      const option = document.createElement("option");
      option.value = member.id;
      option.textContent = member.name;
      playerFilter.appendChild(option);
    });

  if ([...playerFilter.options].some(option => option.value === currentPlayer)) {
    playerFilter.value = currentPlayer;
  }

  dateFilter.innerHTML = `<option value="all">全部日期</option>`;
  [...new Set(allVideos().map(video => video.date))]
    .sort((a, b) => b.localeCompare(a))
    .forEach(date => {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = formatDate(date);
      dateFilter.appendChild(option);
    });

  if ([...dateFilter.options].some(option => option.value === currentDate)) {
    dateFilter.value = currentDate;
  }
}

function matchesSearch(video, query) {
  if (!query) return true;

  const drill = video.drillId ? getDrill(video.drillId) : null;
  const memberNames = (video.memberIds || [])
    .map(getMember)
    .filter(Boolean)
    .map(member => member.name);

  const haystack = [
    video.title,
    video.date,
    video.category,
    video.format,
    video.group,
    drill?.name,
    drill?.description,
    drill?.reps,
    ...memberNames,
    ...(video.notes || []).map(note => note.text)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function filteredVideos() {
  const category = categoryFilter.value;
  const format = formatFilter.value;
  const group = groupFilter.value;
  const player = playerFilter.value;
  const date = dateFilter.value;
  const query = searchInput.value.trim();

  return allVideos()
    .filter(video =>
      (category === "all" || video.category === category) &&
      (format === "all" || video.format === format) &&
      (group === "all" || video.group === group) &&
      (player === "all" || (video.memberIds || []).includes(player)) &&
      (date === "all" || video.date === date) &&
      matchesSearch(video, query)
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderVideos() {
  const items = filteredVideos();
  videoGrid.innerHTML = "";

  const byDate = items.reduce((acc, video) => {
    if (!acc[video.date]) acc[video.date] = [];
    acc[video.date].push(video);
    return acc;
  }, {});

  Object.keys(byDate)
    .sort((a, b) => b.localeCompare(a))
    .forEach(date => {
      const section = document.createElement("section");
      section.className = "date-section";

      const heading = document.createElement("h3");
      heading.className = "date-heading";
      heading.textContent = formatDate(date);

      const grid = document.createElement("div");
      grid.className = "video-grid";

      byDate[date].forEach(video => {
        grid.appendChild(renderVideoCard(video));
      });

      section.appendChild(heading);
      section.appendChild(grid);
      videoGrid.appendChild(section);
    });

  resultCount.textContent = `${items.length} 支影片`;
  videoGrid.hidden = items.length === 0;
  emptyState.hidden = items.length !== 0;
}

function resetLibraryFilters() {
  categoryFilter.value = "all";
  formatFilter.value = "all";
  groupFilter.value = "all";
  playerFilter.value = "all";
  dateFilter.value = "all";
  searchInput.value = "";
  renderVideos();
}

categorySelect.addEventListener("change", setCategoryFields);
drillSelect.addEventListener("change", setCategoryFields);
addMemberButton.addEventListener("click", addMember);
addGroupButton.addEventListener("click", addGroup);
videoForm.addEventListener("submit", handleVideoSubmit);

openCreatorButton.addEventListener("click", () => {
  openCreator();
  resetVideoForm();
  creatorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

closeCreatorButton.addEventListener("click", closeCreator);

cancelOrganizeButton.addEventListener("click", () => {
  closeCreator();
});

[categoryFilter, formatFilter, groupFilter, playerFilter, dateFilter]
  .forEach(control => control.addEventListener("change", renderVideos));

searchInput.addEventListener("input", renderVideos);
$("resetFilters").addEventListener("click", resetLibraryFilters);

renderMemberPicker();
renderGroupOptions();
renderDrillOptions();
resetVideoForm();
creatorPanel.hidden = true;
openCreatorButton.hidden = false;
renderUnsorted();
rebuildFilters();
renderVideos();
