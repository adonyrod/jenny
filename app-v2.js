(() => {
  const content = window.JENNY_CONTENT;
  const $ = (selector) => document.querySelector(selector);
  const memoryGrid = $("#memoryGrid");
  const memoryModal = $("#memoryModal");
  const letterModal = $("#letterModal");
  const toast = $("#toast");

  function normalizeImagePath(path) {
    if (!path) return "assets/fotos/foto-01.jpg";
    return path.replace(/\.webp(?=($|[?#]))/i, ".jpg");
  }

  function setImage(element, path, fallback = "assets/fotos/foto-01.jpg") {
    const normalized = normalizeImagePath(path);
    element.onerror = () => {
      element.onerror = null;
      element.src = fallback;
    };
    element.src = normalized;
  }

  function localDayNumber(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function getState() {
    const now = new Date();
    const parts = content.fechaInicio.split("-").map(Number);
    const start = new Date(parts[0], parts[1] - 1, parts[2]);
    let elapsed = Math.floor((localDayNumber(now) - localDayNumber(start)) / 86400000);

    const params = new URLSearchParams(location.search);
    const preview = Number(params.get("dia"));
    const localPreview = location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (localPreview && Number.isInteger(preview) && preview >= 1 && preview <= content.totalDias) {
      elapsed = preview - 1;
    }

    const index = Math.min(Math.max(elapsed, 0), content.totalDias - 1);
    const unlocked = Math.min(Math.max(elapsed + 1, 1), content.totalDias);
    return { now, index, unlocked, entry: content.dias[index] };
  }

  const state = getState();

  function birthdayEntry(now, fallback) {
    if (now.getMonth() !== 6 || now.getDate() !== 30) return fallback;
    return {
      ...fallback,
      titulo: "Feliz cumpleaños, Jenny",
      palabra: "CELEBRARTE",
      frase: "Feliz cumpleaños, mi amor. Hoy celebro tu vida, tu sonrisa y la bendición de tenerte en mi camino.",
      nota: "Mi vida, cada 30 de julio quiero recordarte cuánto vales. Deseo que este nuevo año te regale salud, paz, metas cumplidas y muchos momentos a mi lado. Te amo, mi cielo.",
      carta: [
        "Mi negrita hermosa:",
        "Hoy es 30 de julio, el día en que nació la mujer que amo. Gracias por existir y por llenar mi vida con tu forma de ser, tu fuerza y tu cariño.",
        "Mi cosita bella, deseo acompañarte en cada cumpleaños, celebrar tus sueños y sostener tu mano en cada etapa. Mereces un año lleno de alegría, salud y oportunidades.",
        "Feliz cumpleaños, mi flaca. Te amo con todo mi corazón. Hoy y todos los días, celebro tu vida."
      ],
      imagen: "assets/fotos/foto-21.jpg"
    };
  }

  state.entry = birthdayEntry(state.now, state.entry);

  function setDailyContent() {
    const { now, entry, index } = state;
    const fullDate = new Intl.DateTimeFormat("es", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }).format(now);
    const month = new Intl.DateTimeFormat("es", { month: "short" }).format(now).replace(".", "").toUpperCase();

    $("#todayDate").textContent = fullDate.charAt(0).toUpperCase() + fullDate.slice(1);
    $("#heroMonth").textContent = month;
    $("#heroDay").textContent = String(now.getDate()).padStart(2, "0");
    $("#yearDay").textContent = String(entry.dia).padStart(3, "0");
    $("#dailyPhrase").textContent = `“${entry.frase}”`;
    $("#dailyNote").textContent = entry.nota;
    $("#dailyWord").textContent = entry.palabra;
    setImage($("#dailyImage"), entry.imagen);
    $("#dailyImage").alt = `Fotografía romántica del día ${entry.dia}: ${entry.titulo}`;
    setImage($("#heroPhoto"), entry.imagen);
    $("#heroPhoto").alt = `Recuerdo especial del día ${entry.dia}`;
    $("#dailyImageCaption").textContent = entry.titulo;
    $("#progressText").textContent = `${entry.dia} de ${content.totalDias}`;
    $("#progressBar").style.width = `${((index + 1) / content.totalDias) * 100}%`;
    $("#heroProject").textContent = `${content.totalDias} días de amor`;
    $("#heroQuote").textContent = entry.frase.replace(/^[^,]+,\s*/, "");
  }

  function renderArchive() {
    memoryGrid.innerHTML = "";
    const start = Math.max(0, state.unlocked - 9);
    const visible = content.dias.slice(start, state.unlocked).reverse();

    visible.forEach((day) => {
      const card = document.createElement("article");
      card.className = "memory-card reveal";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Abrir detalle del día ${day.dia}`);
      const cardImage = normalizeImagePath(day.imagen);
      card.innerHTML = `
        <img src="${cardImage}" alt="Fotografía del día ${day.dia}: ${day.titulo}" loading="lazy" onerror="this.onerror=null;this.src='assets/fotos/foto-01.jpg'">
        <div class="memory-card-content">
          <time>Día ${String(day.dia).padStart(3, "0")}</time>
          <h3>${day.titulo}</h3>
        </div>`;
      const open = () => openMemory(day);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
      });
      memoryGrid.appendChild(card);
    });

    $("#archiveNote").textContent = state.unlocked === 1
      ? "Hoy comienza este archivo. Mañana aparecerá un nuevo detalle."
      : `Ya se han desbloqueado ${state.unlocked} detalles. Aquí aparecen los nueve más recientes.`;
  }

  function openMemory(day) {
    setImage($("#modalImage"), day.imagen);
    $("#modalImage").alt = `Fotografía del día ${day.dia}: ${day.titulo}`;
    $("#modalDate").textContent = `Día ${day.dia} de ${content.totalDias}`;
    $("#modalTitle").textContent = day.titulo;
    $("#modalText").textContent = day.frase;
    memoryModal.showModal();
  }

  function renderLetter() {
    $("#letterContent").innerHTML = state.entry.carta.map((paragraph) => `<p>${paragraph}</p>`).join("");
    $("#letterDay").textContent = `Carta del día ${state.entry.dia}`;
  }

  function updateCounter() {
    const [year, month, day] = content.fechaInicio.split("-").map(Number);
    const start = new Date(year, month - 1, day).getTime();
    const distance = Math.max(0, Date.now() - start);
    const days = Math.floor(distance / 86400000);
    const hours = Math.floor((distance % 86400000) / 3600000);
    const minutes = Math.floor((distance % 3600000) / 60000);
    const seconds = Math.floor((distance % 60000) / 1000);
    $("#days").textContent = days.toLocaleString("es");
    $("#hours").textContent = String(hours).padStart(2, "0");
    $("#minutes").textContent = String(minutes).padStart(2, "0");
    $("#seconds").textContent = String(seconds).padStart(2, "0");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function observeReveals() {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); currentObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
  }

  function launchHearts(x = innerWidth / 2, y = innerHeight / 2) {
    const symbols = ["♥", "♡", "✦"];
    for (let i = 0; i < 18; i += 1) {
      const particle = document.createElement("span");
      particle.className = "heart-particle";
      particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      particle.style.left = `${x + (Math.random() - 0.5) * 90}px`;
      particle.style.top = `${y + (Math.random() - 0.5) * 40}px`;
      particle.style.setProperty("--x", `${(Math.random() - 0.5) * 180}px`);
      particle.style.setProperty("--r", `${(Math.random() - 0.5) * 80}deg`);
      particle.style.color = Math.random() > 0.5 ? "#ffd2df" : "#b59cff";
      particle.style.fontSize = `${0.8 + Math.random() * 1.1}rem`;
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1500);
    }
  }

  function createSoundToggle() {
    let context; let active = false; let timer;
    function playSequence() {
      if (!active) return;
      [261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
        setTimeout(() => {
          if (!active || !context) return;
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "sine"; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, context.currentTime);
          gain.gain.linearRampToValueAtTime(0.025, context.currentTime + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2.2);
          oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 2.3);
        }, index * 580);
      });
      timer = setTimeout(playSequence, 3900);
    }
    return async (button) => {
      active = !active; button.setAttribute("aria-pressed", String(active)); $("#soundIcon").textContent = active ? "♫" : "♪";
      if (active) { context ||= new (window.AudioContext || window.webkitAudioContext)(); await context.resume(); playSequence(); showToast("Sonido activado"); }
      else { clearTimeout(timer); showToast("Sonido desactivado"); }
    };
  }

  const toggleSound = createSoundToggle();
  $("#copyButton").addEventListener("click", async () => {
    const phrase = state.entry.frase;
    try { await navigator.clipboard.writeText(phrase); showToast("Frase copiada"); }
    catch { showToast("Selecciona la frase para copiarla"); }
  });
  $("#surpriseButton").addEventListener("click", (event) => {
    const day = content.dias[Math.floor(Math.random() * state.unlocked)];
    launchHearts(event.clientX, event.clientY); setTimeout(() => openMemory(day), 250);
  });
  $("#soundButton").addEventListener("click", (event) => toggleSound(event.currentTarget));
  $("#openLetter").addEventListener("click", (event) => { launchHearts(event.clientX, event.clientY); letterModal.showModal(); });
  $("#closeMemory").addEventListener("click", () => memoryModal.close());
  $("#closeLetter").addEventListener("click", () => letterModal.close());
  [memoryModal, letterModal].forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

  $("#footerName").textContent = content.nombre;
  $("#year").textContent = new Date().getFullYear();
  setDailyContent(); renderArchive(); renderLetter(); updateCounter(); setInterval(updateCounter, 1000); observeReveals();
})();
