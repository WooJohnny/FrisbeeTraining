const videoGrid = document.getElementById("videoGrid");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");

const formatFilter = document.getElementById("formatFilter");
const groupFilter = document.getElementById("groupFilter");
const playerFilter = document.getElementById("playerFilter");
const searchInput = document.getElementById("searchInput");
const resetFilters = document.getElementById("resetFilters");

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getYouTubeEmbedUrl(videoId, start = 0) {
  const startParam = start > 0 ? `?start=${start}&autoplay=1` : "";
  return `https://www.youtube.com/embed/${videoId}${startParam}`;
}

function populatePlayerFilter() {
  const players = [...new Set(videos.flatMap(video => video.players))]
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));

  players.forEach(player => {
    const option = document.createElement("option");
    option.value = player;
    option.textContent = player;
    playerFilter.appendChild(option);
  });
}

function matchesSearch(video, query) {
  if (!query) return true;

  const searchableText = [
    video.title,
    video.date,
    video.format,
    video.group,
    ...video.players,
    ...video.notes.map(note => note.text)
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query.toLowerCase());
}

function getFilteredVideos() {
  const selectedFormat = formatFilter.value;
  const selectedGroup = groupFilter.value;
  const selectedPlayer = playerFilter.value;
  const query = searchInput.value.trim();

  return videos.filter(video => {
    const formatMatches =
      selectedFormat === "all" || video.format === selectedFormat;

    const groupMatches =
      selectedGroup === "all" || video.group === selectedGroup;

    const playerMatches =
      selectedPlayer === "all" || video.players.includes(selectedPlayer);

    return (
      formatMatches &&
      groupMatches &&
      playerMatches &&
      matchesSearch(video, query)
    );
  });
}

function createVideoCard(video) {
  const article = document.createElement("article");
  article.className = "video-card";

  const iframe = document.createElement("iframe");
  iframe.className = "video-frame";
  iframe.src = getYouTubeEmbedUrl(video.youtubeId);
  iframe.title = video.title;
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;

  const body = document.createElement("div");
  body.className = "card-body";

  body.innerHTML = `
    <div class="card-meta">
      <span class="badge">${video.format}</span>
      <span class="badge neutral">${video.group}</span>
    </div>

    <h3 class="card-title">${video.title}</h3>
    <p class="card-date">${video.date}</p>

    <div class="player-list">
      ${video.players
        .map(
          player =>
            `<button class="player-tag" type="button" data-player="${player}">${player}</button>`
        )
        .join("")}
    </div>
  `;

  const notes = document.createElement("ul");
  notes.className = "notes";

  if (video.notes.length === 0) {
    const noNotes = document.createElement("p");
    noNotes.className = "no-notes";
    noNotes.textContent = "目前沒有註解。";
    body.appendChild(noNotes);
  } else {
    video.notes.forEach(note => {
      const li = document.createElement("li");

      const timeButton = document.createElement("button");
      timeButton.className = "timestamp";
      timeButton.type = "button";
      timeButton.textContent = formatTime(note.time);

      timeButton.addEventListener("click", () => {
        iframe.src = getYouTubeEmbedUrl(video.youtubeId, note.time);
        iframe.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      const text = document.createElement("span");
      text.textContent = note.text;

      li.appendChild(timeButton);
      li.appendChild(text);
      notes.appendChild(li);
    });

    body.appendChild(notes);
  }

  article.appendChild(iframe);
  article.appendChild(body);

  article.querySelectorAll(".player-tag").forEach(button => {
    button.addEventListener("click", () => {
      playerFilter.value = button.dataset.player;
      renderVideos();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  return article;
}

function renderVideos() {
  const filteredVideos = getFilteredVideos();

  videoGrid.innerHTML = "";

  filteredVideos.forEach(video => {
    videoGrid.appendChild(createVideoCard(video));
  });

  resultCount.textContent = `${filteredVideos.length} 支影片`;

  const hasResults = filteredVideos.length > 0;
  videoGrid.hidden = !hasResults;
  emptyState.hidden = hasResults;
}

function resetAllFilters() {
  formatFilter.value = "all";
  groupFilter.value = "all";
  playerFilter.value = "all";
  searchInput.value = "";
  renderVideos();
}

[formatFilter, groupFilter, playerFilter].forEach(filter => {
  filter.addEventListener("change", renderVideos);
});

searchInput.addEventListener("input", renderVideos);
resetFilters.addEventListener("click", resetAllFilters);

populatePlayerFilter();
renderVideos();
