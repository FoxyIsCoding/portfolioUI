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

  const delayedSmoothScroll = (target, { duration = 700, offset = 0 } = {}) => {
    const element = document.querySelector(target);
    if (!element) return;
    const start = window.scrollY;
    const rectTop = element.getBoundingClientRect().top + start - offset;
    const distance = rectTop - start;
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    document.body.classList.add("scroll-blur-strong");

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = start + distance * eased;
      window.scrollTo(0, current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        document.body.classList.remove("scroll-blur-strong");
      }
    };

    requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const target = anchor.getAttribute("href");
      if (target && target !== "#") {
        delayedSmoothScroll(target, { duration: 900, offset: 0 });
      }
    });
  });

  const grid = document.getElementById("reposGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const overlay = document.getElementById("loadingOverlay");
  const cursorEl = document.getElementById("cursor");
  let displayCount = 9;

  const fetchRepos = async () => {
    const url = "https://api.github.com/users/FoxyIsCoding/repos?per_page=100&sort=updated";
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
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

      const activators = Array.from(document.querySelectorAll("a, button, md-button, md-filled-button, md-outlined-button, md-text-button"));
      activators.forEach(el => {
        el.addEventListener("mouseenter", () => cursorEl.classList.add("active"));
        el.addEventListener("mouseleave", () => cursorEl.classList.remove("active"));
      });
    }
  };

  init();
});
