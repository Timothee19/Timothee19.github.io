(() => {
  // 1. Theme toggle with localStorage + system preference fallback
  const html = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    html.setAttribute("data-theme", savedTheme);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    html.setAttribute("data-theme", "light");
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // 2. Interactive project filtering
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".project-card");
  const groups = document.querySelectorAll(".project-group");

  function applyFilter(filter) {
    cards.forEach((card) => {
      const role = card.dataset.role;
      const domain = card.dataset.domain;
      const show =
        filter === "all" ||
        filter === role ||
        filter === domain;
      card.classList.toggle("hidden", !show);
    });

    groups.forEach((group) => {
      const visibleCards = group.querySelectorAll(".project-card:not(.hidden)").length;
      group.classList.toggle("hidden", visibleCards === 0);
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilter(btn.dataset.filter || "all");
    });
  });

  // 3. Progressive enhancement: refresh public GitHub star counts silently
  const publicCards = document.querySelectorAll(".project-card[data-repo]");
  publicCards.forEach((card) => {
    const repo = card.dataset.repo;
    const starEl = card.querySelector("[data-stars]");
    if (!repo || !starEl) return;

    fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.stargazers_count === "number" && data.stargazers_count > 0) {
          starEl.textContent = `★ ${data.stargazers_count}`;
        }
      })
      .catch(() => {
        // Keep static fallback silently if rate-limited or offline
      });
  });
})();
