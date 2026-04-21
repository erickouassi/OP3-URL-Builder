// ------------------------------
// Utility: Format HH:MM:SS
// ------------------------------
function formatDuration(seconds) {
    seconds = Number(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ------------------------------
// Get file size (via server API)
// ------------------------------
async function getFileSize(url) {
    console.log("📡 Requesting file size from server:", url);

    try {
        const response = await fetch(`/api/get-size?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        console.log("📥 Server returned size:", data.size);
        return data.size || null;

    } catch (err) {
        console.log("💥 Error calling server:", err);
        return null;
    }
}

// ------------------------------
// Get duration (browser metadata)
// ------------------------------
function getDuration(url) {
    return new Promise(resolve => {
        console.log("🎵 Loading audio metadata for duration...");

        const audio = new Audio();
        audio.src = url;

        audio.addEventListener("loadedmetadata", () => {
            console.log("⏱ Duration loaded:", audio.duration);
            resolve(audio.duration);
        });

        audio.addEventListener("error", () => {
            console.log("❌ Could not load audio metadata.");
            resolve(null);
        });
    });
}

// ------------------------------
// Build OP3 enclosure + duration
// ------------------------------
async function buildOP3() {
    const input = document.getElementById("mp3").value.trim();
    const resultBox = document.getElementById("result");

    if (!input) {
        resultBox.classList.remove("hidden");
        resultBox.textContent = "Please enter an MP3 URL.";
        return;
    }

    console.log("🚀 Starting OP3 build for:", input);

    // Clean URL for OP3
    let cleaned = input.replace(/^https?:\/\//, "");
    if (!cleaned.endsWith(".mp3")) cleaned += ".mp3";

    const op3URL = `https://op3.dev/e/${cleaned}`;
    console.log("🔗 OP3 URL:", op3URL);

    // Fetch file size (server)
    const audioLength = await getFileSize(input);

    // Fetch duration (browser)
    const duration = await getDuration(input);

    // Build XML tags
    const enclosureTag =
`<enclosure url="${op3URL}" length="${audioLength || ''}" type="audio/mpeg"/>`;

    const itunesDurationTag =
`<itunes:duration>${duration ? Math.round(duration) : ''}</itunes:duration>`;

    // Output
    resultBox.classList.remove("hidden");
    resultBox.textContent =
`Enclosure Tag:
${enclosureTag}

iTunes Duration:
${itunesDurationTag}`;

    console.log("✅ OP3 build complete.");
}
