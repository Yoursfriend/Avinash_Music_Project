console.log("Avinash Music – refactored script.js loaded");

const ALBUMS_JSON = "/songs/albums.json";

let currentSong = new Audio();
let songs = [];
let currFolder = "";

// Helper: Convert seconds to MM:SS
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Play a song by name
function playMusic(track, pauseOnly = false) {
  const encodedTrack = encodeURIComponent(track);
  currentSong.src = `/${currFolder}/${encodedTrack}`;
  document.querySelector(".songinfo").textContent = track;
  document.querySelector(".songtime").textContent = "00:00 / 00:00";

  if (!pauseOnly) {
    currentSong.play();
    document.getElementById("play").src = "img/pause.svg";
  }
}

// Load songs from albums.json
async function getSongs(folderName) {
  currFolder = `songs/${folderName}`;
  let manifest;

  try {
    const res = await fetch(ALBUMS_JSON);
    if (!res.ok) throw new Error("Could not load albums.json");
    manifest = await res.json();
  } catch (err) {
    console.error("Error loading manifest:", err);
    return [];
  }

  const album = manifest.find(a => a.folder === folderName);
  if (!album) {
    console.error(`No album found for "${folderName}"`);
    return [];
  }

  songs = album.tracks.slice();

  const songUL = document.querySelector(".songList ul");
  songUL.innerHTML = songs.map(track => `
    <li>
      <img class="invert" width="34" src="img/music.svg" alt="🎵">
      <div class="info">
        <div>${track.replaceAll("%20", " ")}</div>
        <div></div>
      </div>
      <div class="playnow">
        <span>Play Now</span>
        <img class="invert" src="img/play.svg" alt="▶️">
      </div>
    </li>
  `).join("");

  document.querySelectorAll(".songList li").forEach((li, idx) => {
    li.addEventListener("click", () => playMusic(songs[idx]));
  });

  return songs;
}

// Render all albums
async function displayAlbums() {
  let albums = [];

  try {
    const res = await fetch(ALBUMS_JSON);
    if (!res.ok) throw new Error("Could not load albums.json");
    albums = await res.json();
  } catch (err) {
    console.error("Error fetching albums:", err);
    return;
  }

  const container = document.querySelector(".cardContainer");
  container.innerHTML = "";

  albums.forEach((album) => {
    const folderEnc = encodeURIComponent(album.folder);
    container.innerHTML += `
      <div class="card" data-folder="${album.folder}">
        <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                        stroke-linejoin="round" />
                </svg>
            </div>
        <img src="/songs/${folderEnc}/${album.cover}" alt="${album.title}">
        <h2>${album.title}</h2>
      </div>
    `;
  });
  

  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", async () => {
        const folder = card.dataset.folder;
        const loaded = await getSongs(folder);
        if (loaded.length) playMusic(loaded[0]);
      
        // 👇 Open the hamburger sidebar
        document.querySelector(".left").style.left = "0";
      });      
  });
}

// App init
async function main() {
  await displayAlbums();

  // Auto load first album
  const firstCard = document.querySelector(".card");
  if (firstCard) {
    const folder = firstCard.dataset.folder;
    const loaded = await getSongs(folder);
    if (loaded.length) playMusic(loaded[0], true);
  }

  const playBtn = document.getElementById("play");
  const prevBtn = document.getElementById("previous");
  const nextBtn = document.getElementById("next");
  const volIcon = document.querySelector(".volume > img");
  const volSlider = document.querySelector(".range input");
  const seekbar = document.querySelector(".seekbar");

  playBtn.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      playBtn.src = "img/pause.svg";
    } else {
      currentSong.pause();
      playBtn.src = "img/play.svg";
    }
  });

  prevBtn.addEventListener("click", () => {
    currentSong.pause();
    const idx = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
    if (idx > 0) playMusic(songs[idx - 1]);
  });

  nextBtn.addEventListener("click", () => {
    currentSong.pause();
  
    // Extract current filename from Audio src
    const currentFile = decodeURIComponent(currentSong.src.split("/").pop());
  
    // Get index of current song
    const idx = songs.indexOf(currentFile);
  
    // Loop to first song if at the end
    if (idx === -1 || idx >= songs.length - 1) {
      playMusic(songs[0]);
    } else {
      playMusic(songs[idx + 1]);
    }
  });
  

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").textContent =
      `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      `${(currentSong.currentTime / currentSong.duration) * 100}%`;
  });

  seekbar.addEventListener("click", (e) => {
    const pct = e.offsetX / seekbar.clientWidth;
    currentSong.currentTime = currentSong.duration * pct;
  });

  volSlider.addEventListener("input", (e) => {
    currentSong.volume = e.target.value / 100;
    volIcon.src = currentSong.volume === 0 ? "img/mute.svg" : "img/volume.svg";
  });

  volIcon.addEventListener("click", () => {
    if (volIcon.src.includes("volume.svg")) {
      volIcon.src = "img/mute.svg";
      volSlider.value = 0;
      currentSong.volume = 0;
    } else {
      volIcon.src = "img/volume.svg";
      volSlider.value = 40;
      currentSong.volume = 0.1;
    }
  });

  // Hamburger and close
  document.querySelector(".hamburgerContainer").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });
}

main();
