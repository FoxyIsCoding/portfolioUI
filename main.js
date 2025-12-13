import "https://esm.run/@material/web@latest/all.js";

document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    }
  );

  document.querySelectorAll("section").forEach((section) => {
    observer.observe(section);
  });

  const delayedSmoothScroll = (target, { duration = 900, offset = 0, easing = 'expoOut' } = {}) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    const start = window.scrollY;
    const rectTop = element.getBoundingClientRect().top + start - offset;
    const distance = rectTop - start;
    const startTime = performance.now();
    const easings = {
      expoOut: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
      cubicOut: (t) => 1 - Math.pow(1 - t, 3)
    };
    const ease = easings[easing] || easings.expoOut;

    document.body.classList.add("scroll-motion-blur");

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);
      const current = start + distance * eased;
      window.scrollTo(0, current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        document.body.classList.remove("scroll-motion-blur");
      }
    };

    requestAnimationFrame(step);
  };


  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = anchor.getAttribute("href");
      if (target && target !== "#") {
        delayedSmoothScroll(target, { duration: 900, offset: 0, easing: 'expoOut' });
      }
    });
  });

  let topScrollAccum = 0;
  let topScrollLocked = false;
  const topThreshold = 40;
  
  window.addEventListener('wheel', (e) => {
    const heroEl = document.querySelector('.hero');
    const heroRect = heroEl ? heroEl.getBoundingClientRect() : null;
    const isInHero = heroRect && heroRect.bottom > window.innerHeight * 0.5;
    
    if (isInHero && !topScrollLocked && e.deltaY > 0) {
      e.preventDefault();
      topScrollAccum += e.deltaY;
      
      if (topScrollAccum >= topThreshold) {
        topScrollLocked = true;
        const next = document.querySelector('#work') || document.querySelector('section:nth-of-type(2)');
        if (next) {
          delayedSmoothScroll(next, { duration: 800, offset: 0, easing: 'expoOut' });
        }
        setTimeout(() => { topScrollAccum = 0; topScrollLocked = false; }, 1000);
      }
    }
  }, { passive: false });

  // Custom cursor initialization
  const cursorEl = document.getElementById("cursor");
  if (cursorEl) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    const speed = 0.18;

    const raf = () => {
      currentX += (targetX - currentX) * speed;
      currentY += (targetY - currentY) * speed;
      cursorEl.style.left = `${currentX}px`;
      cursorEl.style.top = `${currentY}px`;
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    window.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    window.addEventListener("mousedown", () => {
      cursorEl.classList.add("click");
    });
    window.addEventListener("mouseup", () => {
      cursorEl.classList.remove("click");
    });

    const activators = Array.from(document.querySelectorAll("a, button, md-button, md-filled-button, md-outlined-button, md-filled-tonal-button, md-text-button, md-chip, md-chip-set, md-assist-chip, md-filter-chip, md-suggestion-chip"));
    activators.forEach(el => {
      el.addEventListener("mouseenter", () => cursorEl.classList.add("active"));
      el.addEventListener("mouseleave", () => cursorEl.classList.remove("active"));
    });
  }

  const grid = document.getElementById("reposGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const overlay = document.getElementById("loadingOverlay");
  let displayCount = 9;

  const fetchRepos = async () => {
    try {
      const url = "https://api.github.com/users/FoxyIsCoding/repos?per_page=100&sort=stars&direction=desc";
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Portfolio-Site"
        }
      });
      
      if (!res.ok) {
        console.error(`GitHub API error: ${res.status}`);
        return [];
      }
      
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch repos:", error);
      return [];
    }
  };

  const formatTopics = (topics) => {
    if (!topics || !topics.length) return "";
    const limited = topics.slice(0, 3);
    return `<md-chip-set>${limited.map(t => `<md-assist-chip label="${t}"></md-assist-chip>`).join("")}</md-chip-set>`;
  };

  const renderRepos = (repos) => {
    const sorted = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);
    const list = sorted.slice(0, displayCount);
    grid.innerHTML = list.map(r => `
      <md-elevated-card class="project-card">
        <div class="card-content">
          <h3>${r.name}</h3>
          <p>${r.description || "No description"}</p>
          ${formatTopics(r.topics)}
          <div style="display:flex;gap:12px;align-items:center;justify-content:space-between">
            ${r.stargazers_count > 0 ? `<div style="display:flex;gap:8px;align-items:center;opacity:.8"><md-icon>star</md-icon><span>${r.stargazers_count}</span></div>` : ""}
            <md-text-button trailing-icon href="${r.html_url}" target="_blank">
              View on GitHub
              <md-icon slot="icon">arrow_forward</md-icon>
            </md-text-button>
          </div>
        </div>
      </md-elevated-card>
    `).join("");
    if (sorted.length <= displayCount) {
      if (loadMoreBtn) loadMoreBtn.style.display = "none";
    } else {
      if (loadMoreBtn) loadMoreBtn.style.display = "inline-flex";
    }
  };

  const showLoading = (state) => {
    if (!overlay || !grid) return;
    overlay.classList.toggle("active", state);
    grid.classList.toggle("loading", state);
  };

  const renderSkeletons = (count = 6) => {
    grid.innerHTML = Array.from({ length: count }).map(() => `
      <md-elevated-card class="project-card">
        <div class="card-content">
          <div class="skeleton" style="height: 24px; width: 60%;"></div>
          <div class="skeleton" style="height: 16px; width: 100%;"></div>
          <div class="skeleton" style="height: 16px; width: 90%;"></div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <div class="skeleton" style="height: 28px; width: 80px;"></div>
            <div class="skeleton" style="height: 28px; width: 80px;"></div>
            <div class="skeleton" style="height: 28px; width: 80px;"></div>
          </div>
        </div>
      </md-elevated-card>
    `).join("");
  };

  const init = async () => {
    showLoading(true);
    renderSkeletons(6);
    const repos = await fetchRepos();
    renderRepos(repos);
    showLoading(false);
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        displayCount += 10;
        renderRepos(repos);
      });
    }

    const fetchDiscordStatus = async () => {
      try {
        const response = await fetch("https://api.lanyard.rest/v1/users/830732127984549929", {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        });
        const data = await response.json();
        if (data.success === false || !data.data) {
          throw new Error("User not found on Lanyard");
        }
        return data.data;
      } catch (error) {
        console.error("Discord Lanyard error:", error);
        return {
          discord_status: "offline",
          activities: [],
          spotify: null
        };
      }
    };

    const renderDiscordStatus = (status) => {
      const statusEl = document.getElementById("discordStatus");
      if (!statusEl) return;

      const discordStatus = status?.discord_status || "offline";
      const activities = status?.activities || [];
      const listening = activities.find(a => a.type === 2);
      const playing = activities.find(a => a.type === 0);

      let statusIcon = "circle";
      let statusText = "Offline";
      let statusColor = "#999";
      let statusBgColor = "rgba(153, 153, 153, 0.1)";

      if (discordStatus === "online") {
        statusIcon = "check_circle";
        statusText = "Online";
        statusColor = "#31a24c";
        statusBgColor = "rgba(49, 162, 76, 0.15)";
      } else if (discordStatus === "idle") {
        statusIcon = "check_circle";
        statusText = "Online";
        statusColor = "#31a24c";
        statusBgColor = "rgba(49, 162, 76, 0.15)";
      } else if (discordStatus === "dnd") {
        statusIcon = "do_not_disturb";
        statusText = "Do Not Disturb";
        statusColor = "#f04747";
        statusBgColor = "rgba(240, 71, 71, 0.15)";
      } else {
        statusIcon = "circle";
        statusText = "Offline";
        statusColor = "#999";
        statusBgColor = "rgba(153, 153, 153, 0.1)";
      }

      const statusClass = discordStatus === "offline" ? "is-offline" : "is-active";

      let activityHTML = "";
      if (listening) {
        let progressHTML = "";
        
        if (listening.timestamps?.start && listening.timestamps?.end) {
          const now = Date.now();
          const start = listening.timestamps.start;
          const end = listening.timestamps.end;
          const duration = end - start;
          const elapsed = Math.max(0, Math.min(duration, now - start));
          const progress = duration > 0 ? (elapsed / duration) * 100 : 0;
          
          const formatTime = (ms) => {
            const seconds = Math.floor((ms / 1000) % 60);
            const minutes = Math.floor((ms / 1000 / 60) % 60);
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
          };
          
          progressHTML = `
            <div class="spotify-progress">
              <md-linear-progress value="${(progress / 100).toFixed(3)}"></md-linear-progress>
              <div class="spotify-time">
                <span>${formatTime(elapsed)}</span>
                <span>${formatTime(duration)}</span>
              </div>
            </div>
          `;
        }
        
        activityHTML += `
          <div class="activity spotify">
            <div class="activity-icon">
              <md-icon>music_note</md-icon>
            </div>
            <div class="activity-content">
              <p class="activity-type">Listening to Spotify</p>
              <p class="activity-name">${listening.details || "Unknown Track"}</p>
              ${listening.state ? `<p class="activity-artist">${listening.state}</p>` : ""}
              ${progressHTML}
            </div>
          </div>
        `;
      }
      if (playing) {
        activityHTML += `
          <div class="activity game">
            <div class="activity-icon">
              <md-icon>sports_esports</md-icon>
            </div>
            <div class="activity-content">
              <p class="activity-type">Playing</p>
              <p class="activity-name">${playing.name}</p>
              ${playing.details ? `<p class="activity-details">${playing.details}</p>` : ""}
            </div>
          </div>
        `;
      }

      statusEl.innerHTML = `
        <div class="status-container">
          <div class="status-header">
            <div class="status-avatar">
              <div class="status-indicator ${statusClass}" style="--status-color: ${statusColor}; --status-bg: ${statusBgColor}">
                <md-icon>${statusIcon}</md-icon>
              </div>
            </div>
            <div class="status-info">
              <p class="status-label">Discord Status</p>
              <p class="status-text">${statusText}</p>
            </div>
          </div>
          ${activityHTML ? `<div class="activities">${activityHTML}</div>` : `<div class="no-activity"><p>No active status</p></div>`}
        </div>
      `;
    };

    const discordStatus = await fetchDiscordStatus();
    renderDiscordStatus(discordStatus);

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const applyTilt = (selector) => {
      if (prefersReduced) return;
      const nodes = Array.from(document.querySelectorAll(selector));
      nodes.forEach(node => {
        let rafId = null;
        const maxX = 6;
        const maxY = 8;
        const perspective = 800;
        const onMove = (e) => {
          const rect = node.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const rx = ((y / rect.height) - 0.5) * -maxX;
          const ry = ((x / rect.width) - 0.5) * maxY;
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            node.style.transform = `perspective(${perspective}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
          });
        };
        const onLeave = () => {
          cancelAnimationFrame(rafId);
          node.style.transform = "";
        };
        node.addEventListener('mousemove', onMove);
        node.addEventListener('mouseleave', onLeave);
      });
    };
    applyTilt('.subtitle, h2');

    const heroNameEl = document.querySelector(".hero h1");
    if (heroNameEl) {
      const baseText = heroNameEl.textContent.trim();
      const targetHoverText = "Matěj Bielik";
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let flickerTimer = null;
      let isAnimating = false;

      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

      const wrapText = (el, text) => {
        const frag = document.createDocumentFragment();
        for (const ch of text) {
          const span = document.createElement("span");
          span.className = "char";
          span.textContent = ch;
          frag.appendChild(span);
        }
        el.innerHTML = "";
        el.appendChild(frag);
      };

      const scrambleTo = (finalText, duration = 900, interval = 45) => {
        if (isAnimating) {
          clearInterval(flickerTimer);
          flickerTimer = null;
        }
        isAnimating = true;

        if (prefersReduced) {
          heroNameEl.textContent = finalText;
          isAnimating = false;
          return;
        }

        heroNameEl.classList.add("flicker");

        wrapText(heroNameEl, finalText);
        const chars = Array.from(heroNameEl.querySelectorAll(".char"));
        let revealIndex = 0;
        const totalLen = chars.length;
        const totalFrames = Math.max(1, Math.round(duration / interval));
        const framesPerLetter = Math.max(2, Math.floor(totalFrames / Math.max(1, totalLen)));
        let frameCount = 0;

        const skipSpacesForward = () => {
          while (revealIndex < totalLen && (finalText[revealIndex] || "") === " ") {
            const span = chars[revealIndex];
            span.textContent = " ";
            span.classList.remove("flicker");
            span.style.setProperty("--blur", "0px");
            span.style.setProperty("--op", "1");
            span.style.setProperty("--scale", "1");
            span.style.setProperty("--jitter", "0px");
            revealIndex++;
          }
        };

        skipSpacesForward();

        flickerTimer = setInterval(() => {
          frameCount++;
          for (let i = 0; i < chars.length; i++) {
            const span = chars[i];
            const target = finalText[i] || "";
            if (i < revealIndex) {
              span.textContent = target;
              span.classList.remove("flicker");
              span.style.setProperty("--blur", "0px");
              span.style.setProperty("--op", "1");
              span.style.setProperty("--scale", "1");
              span.style.setProperty("--jitter", "0px");
              continue;
            }
            if (target === " ") {
              span.textContent = " ";
              span.classList.remove("flicker");
              span.style.setProperty("--blur", "0px");
              span.style.setProperty("--op", "1");
              span.style.setProperty("--scale", "1");
              span.style.setProperty("--jitter", "0px");
              continue;
            }
            const rand = alphabet[Math.floor(Math.random() * alphabet.length)];
            span.textContent = rand;
            span.classList.add("flicker");
            const blurPx = (1.6 + Math.random() * 2.4).toFixed(2);
            span.style.setProperty("--blur", `${blurPx}px`);
            span.style.setProperty("--op", (0.75 + Math.random() * 0.25).toFixed(2));
            const scale = (1.04 + Math.random() * 0.12).toFixed(3);
            const jitter = `${(Math.random() * 2 - 1).toFixed(2)}px`;
            span.style.setProperty("--scale", scale);
            span.style.setProperty("--jitter", jitter);
          }

          if (frameCount % framesPerLetter === 0) {
            if (revealIndex < totalLen) {
              const span = chars[revealIndex];
              span.textContent = finalText[revealIndex] || "";
              span.classList.remove("flicker");
              span.style.setProperty("--blur", "0px");
              span.style.setProperty("--op", "1");
              span.style.setProperty("--scale", "1");
              span.style.setProperty("--jitter", "0px");
              revealIndex++;
              skipSpacesForward();
            }
          }

          if (revealIndex >= totalLen) {
            clearInterval(flickerTimer);
            flickerTimer = null;
            heroNameEl.classList.remove("flicker");
            isAnimating = false;
          }
        }, interval);
      };

      const finalizeText = (text) => {
        if (flickerTimer) {
          clearInterval(flickerTimer);
          flickerTimer = null;
        }
        isAnimating = false;
        heroNameEl.classList.remove("flicker");
        heroNameEl.textContent = text;
      };

      heroNameEl.addEventListener("mouseenter", () => scrambleTo(targetHoverText, 900, 45));
      heroNameEl.addEventListener("mouseleave", () => scrambleTo(baseText, 500, 45));
      const heroSection = document.querySelector('.hero');
      if (heroSection) {
        heroSection.addEventListener("mouseleave", () => scrambleTo(baseText, 500, 45));
        heroSection.addEventListener("pointerleave", () => scrambleTo(baseText, 500, 45));
      }
    }
  };

  init();
});
