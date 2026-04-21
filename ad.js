async function loadAds() {
  const res = await fetch("ads.json");
  const data = await res.json();
  return data;
}

function weightedRandom(ads, allowedSpots = null) {
  let candidates = ads;
  if (allowedSpots) {
    candidates = ads.filter(ad => 
      !ad.preferred_spots || ad.preferred_spots.some(spot => allowedSpots.includes(spot))
    );
  }
  
  if (candidates.length === 0) return null; // fallback if no match

  const totalWeight = candidates.reduce((sum, ad) => sum + ad.weight, 0);
  let random = Math.random() * totalWeight;

  for (const ad of candidates) {
    if (random < ad.weight) return ad;
    random -= ad.weight;
  }
  return candidates[0]; // safety fallback
}

function renderAd(ad, container) {
  if (!ad) return;

  container.innerHTML = `
    <div class="ad-label">${ad.label}</div>
    ${
      ad.type === "image"
        ? `<a href="${ad.url}" target="_blank" rel="sponsored noopener"><img src="${ad.image}" class="ad-img"></a>`
        : `<a href="${ad.url}" target="_blank" rel="sponsored noopener">${ad.text}</a>`
    }
  `;
}

function hideAdSpot(container) {
  container.classList.add("ad-hidden");
}

async function initAds() {
  const config = await loadAds();

  if (!config.settings.ads_enabled) {
    document.querySelectorAll(".ad-zone").forEach(hideAdSpot);
    return;
  }

  // Basic ad-blocker detection
  let adBlocked = false;
  try {
    const testAd = document.createElement("div");
    testAd.className = "adsbox";
    document.body.appendChild(testAd);
    if (testAd.offsetHeight === 0) adBlocked = true;
    testAd.remove();
  } catch {
    adBlocked = true;
  }

  if (adBlocked) {
    document.querySelectorAll(".ad-zone").forEach(el => {
      el.innerHTML = `<p>${config.fallback_message}</p>
      <a href="${config.support_no_ads.url}" class="support-link" target="_blank">${config.support_no_ads.text}</a>`;
    });
    return;
  }

  // Rotating ads – now per-zone aware
  const adSpots = document.querySelectorAll("[data-ad-spot]");
  
  function rotateAds() {
    adSpots.forEach(spot => {
      const spotType = spot.getAttribute("data-ad-spot"); // "top", "middle", "bottom"
      let allowed = [spotType];
      
      // Allow top ads to appear in bottom sometimes, etc.
      if (spotType === "bottom") allowed.push("top");
      if (spotType === "top") allowed.push("bottom");

      const ad = weightedRandom(config.ads, allowed);
      renderAd(ad, spot);
    });
  }

  rotateAds();
  setInterval(rotateAds, config.settings.rotation_interval);

  // ────────────────────────────────────────────────
  // Popup with 5-minute frequency cap (suggestion #6)
  // ────────────────────────────────────────────────
  if (config.settings.popup_enabled) {
    function canShowPopup() {
      const lastShown = localStorage.getItem("lastPopupTime");
      if (!lastShown) return true;
      const minutesSince = (Date.now() - parseInt(lastShown)) / 60000;
      return minutesSince >= 5;
    }

    function showPopupAd() {
      if (!canShowPopup()) return;

      const ad = weightedRandom(config.ads); // no spot restriction for popup

      const modal = document.createElement("div");
      modal.className = "popup-ad";
      modal.innerHTML = `
        <div class="popup-content">
          <div class="ad-label">${ad.label}</div>
          ${
            ad.type === "image"
              ? `<a href="${ad.url}" target="_blank" rel="sponsored noopener"><img src="${ad.image}"></a>`
              : `<a href="${ad.url}" target="_blank" rel="sponsored noopener">${ad.text}</a>`
          }
          <button class="close-popup">Close</button>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector(".close-popup").onclick = () => {
        modal.remove();
        localStorage.setItem("lastPopupTime", Date.now());
      };

      // Also save on click (in case they click the ad)
      modal.querySelector("a").addEventListener("click", () => {
        localStorage.setItem("lastPopupTime", Date.now());
      }, { once: true });
    }

    function randomPopupLoop() {
      const delay = Math.random() * 
        (config.settings.popup_max - config.settings.popup_min) + 
        config.settings.popup_min;

      setTimeout(() => {
        showPopupAd();
        randomPopupLoop();
      }, delay);
    }

    randomPopupLoop();
  }
}

initAds();

const style = document.createElement('style');
style.innerHTML = `

/* ==========================================================================
   Ad Zones
   ========================================================================== */

.ad-zone {
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
}

/* Top & Bottom banners */
.ad-top,
.ad-bottom {
  max-width: 970px;
  margin: 24px auto;
}

/* Middle Ad – same size on all screens */
.ad-middle {
  width: 280px;
  min-height: 200px;
  flex-shrink: 0;
  margin: 0 auto;      /* centers it */
  opacity: 0.95;
}

/* Hide middle ad on mid-size and smaller screens */
@media (max-width: 1159px) {
  .ad-middle {
    display: none;
  }

  .container {
    max-width: 100%;
  }
}


.ad-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.support-link {
  color: #2563eb;
  font-weight: 500;
}

/* Hide helper class used by ad.js */
.ad-hidden {
  display: none !important;
}


`;
document.head.appendChild(style);
