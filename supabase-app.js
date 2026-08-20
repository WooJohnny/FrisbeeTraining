import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://hjabmtazwyinufobvvaj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_1Zp2i7vKR9NLv8UZ_wpJJA_vGh9DXPZ";
const SITE_URL = "https://woojohnny.github.io/FrisbeeTraining/supabase.html";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (id) => document.getElementById(id);

const state = {
  session: null,
  profile: null,
  members: [],
  groups: [],
  drills: [],
  videos: [],
  mySubmissions: [],
  pending: { members: [], groups: [], drills: [], videos: [], changes: [] },
};

const canSubmit = () => ["contributor", "approver", "admin"].includes(state.profile?.role);
const canApprove = () => ["approver", "admin"].includes(state.profile?.role);

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setMessage(el, text = "", ok = false) {
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("success-message", ok);
}

function extractYouTubeId(input) {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) return parts[1] || null;
    }
  } catch (_) {}

  return null;
}

function embedUrl(id) {
  return `https://www.youtube.com/embed/${id}`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${dateString}T00:00:00`));
}

function memberClass(member) {
  return member?.gender === "female" ? "female" : "male";
}

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: SITE_URL },
  });

  if (error) alert(error.message);
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) alert(error.message);
  await refreshAll();
}

async function loadSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("getSession", error);

  state.session = data?.session || null;
  state.profile = null;

  if (!state.session) return;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, invite_verified")
    .eq("id", state.session.user.id)
    .single();

  if (profileError) console.error("profile", profileError);
  state.profile = profile || null;

  if (window.location.hash.includes("access_token=")) {
    history.replaceState(null, "", window.location.pathname);
  }
}

function renderAuth() {
  const signedIn = Boolean(state.session);

  $("signedOutUI").hidden = signedIn;
  $("signedInUI").hidden = !signedIn;
  $("passphrasePanel").hidden = !signedIn || canSubmit();
  $("openCreatorButton").hidden = !canSubmit();
  $("mySubmissionsPanel").hidden = !signedIn;
  $("reviewPanel").hidden = !canApprove();

  if (!signedIn) return;

  const user = state.session.user;
  $("userName").textContent =
    state.profile?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "User";

  const role = state.profile?.role || "viewer";
  $("roleBadge").textContent = role;
  $("roleBadge").className = `role-badge role-${role}`;

  const avatar = state.profile?.avatar_url || user.user_metadata?.avatar_url;
  if (avatar) {
    $("userAvatar").src = avatar;
    $("userAvatar").hidden = false;
  } else {
    $("userAvatar").hidden = true;
  }
}

async function verifyPassphrase() {
  const passphrase = $("passphraseInput").value.trim();
  if (!passphrase) {
    setMessage($("passphraseMessage"), "請輸入通關密語。");
    return;
  }

  $("verifyPassphraseButton").disabled = true;
  setMessage($("passphraseMessage"), "驗證中…");

  const { data, error } = await supabase.functions.invoke("verify-passphrase", {
    body: { passphrase },
  });

  $("verifyPassphraseButton").disabled = false;

  if (error) {
    console.error(error);
    setMessage($("passphraseMessage"), "通關密語後端尚未部署，或驗證失敗。");
    return;
  }

  if (!data?.ok) {
    setMessage($("passphraseMessage"), data?.message || "密語錯誤。");
    return;
  }

  $("passphraseInput").value = "";
  setMessage($("passphraseMessage"), "驗證成功！", true);
  await refreshAll();
}

async function loadPublicData() {
  const [membersRes, groupsRes, drillsRes, videosRes] = await Promise.all([
    supabase.from("members").select("id,name,gender,status,created_by").order("name"),
    supabase.from("groups").select("id,name,status,created_by").order("name"),
    supabase.from("drills").select("id,name,description,reps,status,created_by").order("name"),
    supabase
      .from("videos")
      .select(`
        id,youtube_url,youtube_id,title,event_date,category,format,status,created_by,group_id,drill_id,
        groups(id,name,status),
        drills(id,name,description,reps,status),
        video_members(member_id,members(id,name,gender,status))
      `)
      .eq("status", "approved")
      .order("event_date", { ascending: false }),
  ]);

  for (const result of [membersRes, groupsRes, drillsRes, videosRes]) {
    if (result.error) console.error(result.error);
  }

  state.members = membersRes.data || [];
  state.groups = groupsRes.data || [];
  state.drills = drillsRes.data || [];
  state.videos = videosRes.data || [];
}

async function loadMySubmissions() {
  if (!state.session) {
    state.mySubmissions = [];
    return;
  }

  const { data, error } = await supabase
    .from("videos")
    .select("id,title,event_date,category,format,status,youtube_id,created_at")
    .eq("created_by", state.session.user.id)
    .order("created_at", { ascending: false });

  if (error) console.error(error);
  state.mySubmissions = data || [];
}

async function loadPending() {
  if (!canApprove()) {
    state.pending = { members: [], groups: [], drills: [], videos: [], changes: [] };
    return;
  }

  const [members, groups, drills, videos, changes] = await Promise.all([
    supabase.from("members").select("*").eq("status", "pending").order("created_at"),
    supabase.from("groups").select("*").eq("status", "pending").order("created_at"),
    supabase.from("drills").select("*").eq("status", "pending").order("created_at"),
    supabase
      .from("videos")
      .select(`
        *,
        groups(id,name,status),
        drills(id,name,status),
        video_members(member_id,members(id,name,gender,status))
      `)
      .eq("status", "pending")
      .order("created_at"),
    supabase.from("change_requests").select("*").eq("status", "pending").order("created_at"),
  ]);

  state.pending = {
    members: members.data || [],
    groups: groups.data || [],
    drills: drills.data || [],
    videos: videos.data || [],
    changes: changes.data || [],
  };
}

function renderMemberPicker() {
  const selected = new Set(
    [...$("memberPicker").querySelectorAll("input:checked")].map((input) => input.value),
  );

  $("memberPicker").innerHTML =
    state.members
      .map(
        (member) => `
          <label class="member-option ${memberClass(member)}">
            <input type="checkbox" value="${esc(member.id)}" ${selected.has(member.id) ? "checked" : ""} />
            <span>${esc(member.name)}${member.status === "pending" ? " · 待審" : ""}</span>
          </label>
        `,
      )
      .join("") || '<p class="muted">目前沒有成員。可先送出新成員申請。</p>';
}

function renderGroupOptions() {
  const current = $("groupSelect").value;
  $("groupSelect").innerHTML =
    '<option value="">請選擇</option>' +
    state.groups
      .map(
        (group) =>
          `<option value="${esc(group.id)}">${esc(group.name)}${group.status === "pending" ? " · 待審" : ""}</option>`,
      )
      .join("");

  if ([...$("groupSelect").options].some((option) => option.value === current)) {
    $("groupSelect").value = current;
  }
}

function renderDrillOptions() {
  const current = $("drillSelect").value;
  $("drillSelect").innerHTML =
    '<option value="">請選擇</option>' +
    state.drills
      .map(
        (drill) =>
          `<option value="${esc(drill.id)}">${esc(drill.name)}${drill.status === "pending" ? " · 待審" : ""}</option>`,
      )
      .join("") +
    '<option value="__new__">＋ 建立新 Drill</option>';

  if ([...$("drillSelect").options].some((option) => option.value === current)) {
    $("drillSelect").value = current;
  }
}

function renderCreateData() {
  renderMemberPicker();
  renderGroupOptions();
  renderDrillOptions();
}

function setCategoryFields() {
  const category = $("categorySelect").value;
  $("scrimmageFields").hidden = category !== "對抗";
  $("drillFields").hidden = category !== "Drill";
  $("newDrillFields").hidden = category !== "Drill" || $("drillSelect").value !== "__new__";
}

async function submitMember() {
  if (!canSubmit()) return;

  const name = $("newMemberName").value.trim();
  const gender = $("newMemberGender").value;

  if (!name || !gender) {
    setMessage($("memberMessage"), "名字和性別都要填。");
    return;
  }

  const { data, error } = await supabase
    .from("members")
    .insert({ name, gender, status: "pending" })
    .select()
    .single();

  if (error) {
    setMessage($("memberMessage"), error.message);
    return;
  }

  $("newMemberName").value = "";
  $("newMemberGender").value = "";
  setMessage($("memberMessage"), `${name} 已送出審核。`, true);

  await loadPublicData();
  renderCreateData();

  const checkbox = [...$("memberPicker").querySelectorAll("input")].find(
    (input) => input.value === data.id,
  );
  if (checkbox) checkbox.checked = true;
}

async function submitGroup() {
  if (!canSubmit()) return;

  const name = $("newGroupName").value.trim();
  if (!name) {
    setMessage($("groupMessage"), "請輸入組別名稱。");
    return;
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({ name, status: "pending" })
    .select()
    .single();

  if (error) {
    setMessage($("groupMessage"), error.message);
    return;
  }

  $("newGroupName").value = "";
  setMessage($("groupMessage"), `${name} 已送出審核。`, true);

  await loadPublicData();
  renderCreateData();
  $("groupSelect").value = data.id;
}

async function submitDrill() {
  if (!canSubmit()) return;

  const name = $("newDrillName").value.trim();
  const description = $("newDrillDescription").value.trim();
  const reps = Number($("newDrillReps").value);

  if (!name || !description || !Number.isInteger(reps) || reps < 1) {
    setMessage($("drillMessage"), "Drill 名字、描述、次數都要填。");
    return;
  }

  const { data, error } = await supabase
    .from("drills")
    .insert({ name, description, reps, status: "pending" })
    .select()
    .single();

  if (error) {
    setMessage($("drillMessage"), error.message);
    return;
  }

  $("newDrillName").value = "";
  $("newDrillDescription").value = "";
  $("newDrillReps").value = "";
  setMessage($("drillMessage"), `${name} 已送出審核。`, true);

  await loadPublicData();
  renderCreateData();
  $("drillSelect").value = data.id;
  $("newDrillFields").hidden = true;
}

function autoTitle(category, row) {
  if (category === "對抗") {
    const group = state.groups.find((item) => item.id === row.group_id);
    return `${row.format} ${group?.name || "對抗"}`;
  }

  if (category === "Drill") {
    return state.drills.find((item) => item.id === row.drill_id)?.name || "Drill";
  }

  return "體能訓練";
}

async function submitVideo(event) {
  event.preventDefault();

  if (!canSubmit()) {
    setMessage($("videoFormMessage"), "你目前沒有投稿權限。");
    return;
  }

  const youtube_url = $("youtubeUrl").value.trim();
  const youtube_id = extractYouTubeId(youtube_url);
  const event_date = $("videoDate").value;
  const category = $("categorySelect").value;
  const memberIds = [...$("memberPicker").querySelectorAll("input:checked")].map(
    (input) => input.value,
  );

  if (!youtube_id) {
    setMessage($("videoFormMessage"), "YouTube 連結格式不正確。");
    return;
  }

  if (!event_date || !category) {
    setMessage($("videoFormMessage"), "請填日期與類別。");
    return;
  }

  if (!memberIds.length) {
    setMessage($("videoFormMessage"), "至少選一位成員。");
    return;
  }

  const row = {
    youtube_url,
    youtube_id,
    event_date,
    category,
    status: "pending",
    format: null,
    group_id: null,
    drill_id: null,
  };

  if (category === "對抗") {
    row.format = $("formatSelect").value;
    row.group_id = $("groupSelect").value || null;

    if (!row.format || !row.group_id) {
      setMessage($("videoFormMessage"), "對抗影片要選形式與組別。");
      return;
    }
  }

  if (category === "Drill") {
    if ($("drillSelect").value === "__new__") {
      setMessage($("videoFormMessage"), "請先送出新 Drill，再選它。");
      return;
    }

    row.drill_id = $("drillSelect").value || null;
    if (!row.drill_id) {
      setMessage($("videoFormMessage"), "請選 Drill。");
      return;
    }
  }

  row.title = $("videoTitle").value.trim() || autoTitle(category, row);

  const { data: video, error } = await supabase.from("videos").insert(row).select().single();
  if (error) {
    setMessage($("videoFormMessage"), error.message);
    return;
  }

  const links = memberIds.map((member_id) => ({ video_id: video.id, member_id }));
  const { error: linkError } = await supabase.from("video_members").insert(links);

  if (linkError) {
    setMessage($("videoFormMessage"), `影片已建立，但成員關聯失敗：${linkError.message}`);
    return;
  }

  closeCreator();
  await refreshAll();
  alert("影片已送出審核。通過後才會出現在正式影片庫。");
}

function openCreator() {
  $("creatorPanel").hidden = false;
  $("openCreatorButton").hidden = true;
  $("videoDate").value ||= new Date().toLocaleDateString("en-CA");
  $("creatorPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeCreator() {
  $("creatorPanel").hidden = true;
  $("openCreatorButton").hidden = !canSubmit();
  $("videoForm").reset();
  $("videoDate").value = new Date().toLocaleDateString("en-CA");
  setCategoryFields();

  for (const id of ["memberMessage", "groupMessage", "drillMessage", "videoFormMessage"]) {
    setMessage($(id));
  }

  renderCreateData();
}

function videoMembers(video) {
  return (video.video_members || []).map((item) => item.members).filter(Boolean);
}

function renderVideoCardHTML(video) {
  const members = videoMembers(video);
  const drillBox =
    video.category === "Drill" && video.drills
      ? `
          <div class="detail-box">
            <strong>${esc(video.drills.name)}</strong>
            <p>${esc(video.drills.description || "")}</p>
            <p class="detail-line">Drill 次數：${esc(video.drills.reps)}</p>
          </div>
        `
      : "";

  return `
    <article class="video-card">
      <iframe class="video-frame" src="${embedUrl(video.youtube_id)}" title="${esc(video.title)}" allowfullscreen></iframe>
      <div class="card-body">
        <div class="card-meta">
          <span class="badge">${esc(video.category)}</span>
          ${video.format ? `<span class="badge neutral">${esc(video.format)}</span>` : ""}
          ${video.groups?.name ? `<span class="badge neutral">${esc(video.groups.name)}</span>` : ""}
        </div>
        <h3 class="card-title">${esc(video.title)}</h3>
        <p class="card-date">${formatDate(video.event_date)}</p>
        <div class="player-list">
          ${members.map((member) => `<span class="player-tag ${memberClass(member)}">${esc(member.name)}</span>`).join("")}
        </div>
        ${drillBox}
        ${canSubmit() ? `<button class="danger-ghost request-delete" data-video-id="${video.id}" type="button">申請刪除</button>` : ""}
      </div>
    </article>
  `;
}

function renderLibrary() {
  const category = $("categoryFilter").value;
  const format = $("formatFilter").value;
  const group = $("groupFilter").value;
  const player = $("playerFilter").value;
  const date = $("dateFilter").value;
  const query = $("searchInput").value.trim().toLowerCase();

  const items = state.videos.filter((video) => {
    const members = videoMembers(video);
    const haystack = [
      video.title,
      video.category,
      video.format,
      video.groups?.name,
      video.drills?.name,
      ...members.map((member) => member.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (category === "all" || video.category === category) &&
      (format === "all" || video.format === format) &&
      (group === "all" || video.group_id === group) &&
      (player === "all" || members.some((member) => member.id === player)) &&
      (date === "all" || video.event_date === date) &&
      (!query || haystack.includes(query))
    );
  });

  const byDate = items.reduce((acc, video) => {
    (acc[video.event_date] ||= []).push(video);
    return acc;
  }, {});

  $("videoGrid").innerHTML = Object.keys(byDate)
    .sort((a, b) => b.localeCompare(a))
    .map(
      (dateKey) => `
        <section class="date-section">
          <h3 class="date-heading">${formatDate(dateKey)}</h3>
          <div class="video-grid">
            ${byDate[dateKey].map((video) => renderVideoCardHTML(video)).join("")}
          </div>
        </section>
      `,
    )
    .join("");

  $("resultCount").textContent = `${items.length} 支影片`;
  $("emptyState").hidden = items.length > 0;
  bindDeleteButtons();
}

async function requestDelete(videoId) {
  const reason = prompt("刪除原因（例如：重複影片、連結失效、分類錯誤）");
  if (reason === null) return;

  const { error } = await supabase.from("change_requests").insert({
    target_type: "video",
    target_id: videoId,
    action: "delete",
    reason: reason.trim(),
    status: "pending",
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("刪除申請已送出，需 Approver / Admin 核准。");
  await refreshAll();
}

function bindDeleteButtons() {
  document.querySelectorAll(".request-delete").forEach((button) => {
    button.addEventListener("click", () => requestDelete(button.dataset.videoId));
  });
}

function rebuildFilters() {
  const groupCurrent = $("groupFilter").value;
  const playerCurrent = $("playerFilter").value;
  const dateCurrent = $("dateFilter").value;

  $("groupFilter").innerHTML =
    '<option value="all">全部</option>' +
    state.groups
      .filter((group) => group.status === "approved")
      .map((group) => `<option value="${group.id}">${esc(group.name)}</option>`)
      .join("");

  $("playerFilter").innerHTML =
    '<option value="all">全部</option>' +
    state.members
      .filter((member) => member.status === "approved")
      .map((member) => `<option value="${member.id}">${esc(member.name)}</option>`)
      .join("");

  const dates = [...new Set(state.videos.map((video) => video.event_date))].sort((a, b) =>
    b.localeCompare(a),
  );

  $("dateFilter").innerHTML =
    '<option value="all">全部日期</option>' +
    dates.map((item) => `<option value="${item}">${formatDate(item)}</option>`).join("");

  if ([...$("groupFilter").options].some((option) => option.value === groupCurrent)) {
    $("groupFilter").value = groupCurrent;
  }
  if ([...$("playerFilter").options].some((option) => option.value === playerCurrent)) {
    $("playerFilter").value = playerCurrent;
  }
  if ([...$("dateFilter").options].some((option) => option.value === dateCurrent)) {
    $("dateFilter").value = dateCurrent;
  }
}

function renderMySubmissions() {
  if (!state.session) {
    $("mySubmissionsGrid").innerHTML = "";
    return;
  }

  $("mySubmissionsGrid").innerHTML =
    state.mySubmissions
      .map(
        (video) => `
          <article class="review-card">
            <div><span class="status-pill status-${video.status}">${esc(video.status)}</span></div>
            <strong>${esc(video.title)}</strong>
            <p>${formatDate(video.event_date)} · ${esc(video.category)}${video.format ? ` · ${esc(video.format)}` : ""}</p>
          </article>
        `,
      )
      .join("") || '<p class="muted">你還沒有投稿。</p>';
}

function reviewSection(title, type, items, formatter) {
  return `
    <section class="review-block">
      <h3>${title} <span class="mini-count">${items.length}</span></h3>
      <div class="review-grid">
        ${
          items
            .map(
              (item) => `
                <article class="review-card">
                  ${formatter(item)}
                  <div class="review-actions">
                    <button class="secondary-button review-reject" data-type="${type}" data-id="${item.id}" type="button">Reject</button>
                    <button class="primary-button review-approve" data-type="${type}" data-id="${item.id}" type="button">Approve</button>
                  </div>
                </article>
              `,
            )
            .join("") || '<p class="muted">沒有待審核項目。</p>'
        }
      </div>
    </section>
  `;
}

function renderReview() {
  if (!canApprove()) {
    $("reviewSections").innerHTML = "";
    return;
  }

  const pending = state.pending;
  const total =
    pending.members.length +
    pending.groups.length +
    pending.drills.length +
    pending.videos.length +
    pending.changes.length;

  $("reviewCount").textContent = `${total} 件待審`;

  const sections = [
    reviewSection(
      "成員",
      "member",
      pending.members,
      (member) => `<strong>${esc(member.name)}</strong><p>${member.gender === "female" ? "女性" : "男性"}</p>`,
    ),
    reviewSection("組別", "group", pending.groups, (group) => `<strong>${esc(group.name)}</strong>`),
    reviewSection(
      "Drill",
      "drill",
      pending.drills,
      (drill) => `<strong>${esc(drill.name)}</strong><p>${esc(drill.description)}</p><p>次數：${esc(drill.reps)}</p>`,
    ),
    reviewSection("影片", "video", pending.videos, (video) => {
      const dependencies = [
        video.groups,
        video.drills,
        ...(video.video_members || []).map((item) => item.members),
      ].filter(Boolean);
      const hasPendingDependencies = dependencies.some((item) => item.status === "pending");

      return `
        <strong>${esc(video.title)}</strong>
        <p>${formatDate(video.event_date)} · ${esc(video.category)}${video.format ? ` · ${esc(video.format)}` : ""}</p>
        ${hasPendingDependencies ? '<p class="warning-text">有相關成員 / Drill / 組別仍在 Pending，請先審那些項目。</p>' : ""}
      `;
    }),
  ];

  sections.push(`
    <section class="review-block">
      <h3>修改 / 刪除申請 <span class="mini-count">${pending.changes.length}</span></h3>
      <div class="review-grid">
        ${
          pending.changes
            .map(
              (request) => `
                <article class="review-card">
                  <strong>${esc(request.action)} · ${esc(request.target_type)}</strong>
                  <p>${esc(request.reason || "沒有填原因")}</p>
                  <div class="review-actions">
                    <button class="secondary-button change-reject" data-id="${request.id}" type="button">Reject</button>
                    <button class="primary-button change-approve" data-id="${request.id}" type="button">Approve</button>
                  </div>
                </article>
              `,
            )
            .join("") || '<p class="muted">沒有待審核項目。</p>'
        }
      </div>
    </section>
  `);

  $("reviewSections").innerHTML = sections.join("");
  bindReviewButtons();
}

async function reviewEntity(type, id, approved) {
  const tableMap = {
    member: "members",
    group: "groups",
    drill: "drills",
    video: "videos",
  };

  const table = tableMap[type];
  if (!table) return;

  const payload = {
    status: approved ? "approved" : "rejected",
    approved_by: state.session.user.id,
    approved_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(table).update(payload).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }

  await refreshAll();
}

async function reviewChange(id, approved) {
  const request = state.pending.changes.find((item) => item.id === id);
  if (!request) return;

  if (approved && request.action === "delete") {
    const tableMap = {
      video: "videos",
      member: "members",
      drill: "drills",
      group: "groups",
    };

    const table = tableMap[request.target_type];
    const { error: archiveError } = await supabase
      .from(table)
      .update({ status: "archived" })
      .eq("id", request.target_id);

    if (archiveError) {
      alert(archiveError.message);
      return;
    }
  }

  const { error } = await supabase
    .from("change_requests")
    .update({
      status: approved ? "approved" : "rejected",
      reviewed_by: state.session.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  await refreshAll();
}

function bindReviewButtons() {
  document.querySelectorAll(".review-approve").forEach((button) => {
    button.addEventListener("click", () => reviewEntity(button.dataset.type, button.dataset.id, true));
  });

  document.querySelectorAll(".review-reject").forEach((button) => {
    button.addEventListener("click", () => reviewEntity(button.dataset.type, button.dataset.id, false));
  });

  document.querySelectorAll(".change-approve").forEach((button) => {
    button.addEventListener("click", () => reviewChange(button.dataset.id, true));
  });

  document.querySelectorAll(".change-reject").forEach((button) => {
    button.addEventListener("click", () => reviewChange(button.dataset.id, false));
  });
}

async function refreshAll() {
  await loadSession();
  await Promise.all([loadPublicData(), loadMySubmissions()]);
  await loadPending();

  renderAuth();
  renderCreateData();
  rebuildFilters();
  renderLibrary();
  renderMySubmissions();
  renderReview();
}

$("googleLoginButton").addEventListener("click", signInWithGoogle);
$("signOutButton").addEventListener("click", signOut);
$("verifyPassphraseButton").addEventListener("click", verifyPassphrase);
$("openCreatorButton").addEventListener("click", openCreator);
$("closeCreatorButton").addEventListener("click", closeCreator);
$("cancelCreatorButton").addEventListener("click", closeCreator);
$("categorySelect").addEventListener("change", setCategoryFields);
$("drillSelect").addEventListener("change", setCategoryFields);
$("addMemberButton").addEventListener("click", submitMember);
$("addGroupButton").addEventListener("click", submitGroup);
$("createDrillButton").addEventListener("click", submitDrill);
$("videoForm").addEventListener("submit", submitVideo);

for (const id of ["categoryFilter", "formatFilter", "groupFilter", "playerFilter", "dateFilter"]) {
  $(id).addEventListener("change", renderLibrary);
}

$("searchInput").addEventListener("input", renderLibrary);
$("resetFilters").addEventListener("click", () => {
  for (const id of ["categoryFilter", "formatFilter", "groupFilter", "playerFilter", "dateFilter"]) {
    $(id).value = "all";
  }
  $("searchInput").value = "";
  renderLibrary();
});

supabase.auth.onAuthStateChange(() => {
  setTimeout(refreshAll, 0);
});

await refreshAll();
