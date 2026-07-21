(() => {
  const content = window.JENNY_CONTENT;
  const $ = (selector) => document.querySelector(selector);
  const memoryGrid = $("#memoryGrid");
  const memoryModal = $("#memoryModal");
  const letterModal = $("#letterModal");
  const toast = $("#toast");

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
      imagen: "foto-21.jpg"
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
    $("#dailyImage").src = entry.imagen;
    $("#dailyImage").alt = `Fotografía romántica del día ${entry.dia}: ${entry.titulo}`;
    $("#heroPhoto").src = entry.imagen;
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
      card.innerHTML = `
        <img src="${day.imagen}" alt="Fotografía del día ${day.dia}: ${day.titulo}" loading="lazy">
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
    $("#modalImage").src = day.imagen;
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
    let context = null;
    let master = null;
    let loopTimer = null;
    let active = false;
    let scheduledSources = [];

    const melodyNamesA = [
      "Susurro", "Abrazo", "Mirada", "Promesa", "Latido", "Encuentro",
      "Cielo", "Ternura", "Recuerdo", "Sonrisa", "Destino", "Luz"
    ];
    const melodyNamesB = [
      "de luna", "para Jenny", "sin prisa", "de nosotros", "del corazón",
      "junto a ti", "de verano", "en tus ojos", "de madrugada", "eterna"
    ];

    function seededRandom(seed) {
      let value = seed >>> 0;
      return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function midiToFrequency(note) {
      return 440 * Math.pow(2, (note - 69) / 12);
    }

    function makeImpulse(audioContext, seconds = 2.8, decay = 2.5) {
      const rate = audioContext.sampleRate;
      const length = Math.floor(rate * seconds);
      const impulse = audioContext.createBuffer(2, length, rate);
      const random = seededRandom(state.entry.dia * 7919 + 31);
      for (let channel = 0; channel < 2; channel += 1) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i += 1) {
          data[i] = (random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      return impulse;
    }

    function createAudioGraph() {
      context = new (window.AudioContext || window.webkitAudioContext)();
      master = context.createGain();
      master.gain.value = 0.24;

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 24;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.45;

      const reverb = context.createConvolver();
      reverb.buffer = makeImpulse(context);
      const reverbGain = context.createGain();
      reverbGain.gain.value = 0.34;

      const dryGain = context.createGain();
      dryGain.gain.value = 0.86;

      const delay = context.createDelay(1.2);
      delay.delayTime.value = 0.34;
      const feedback = context.createGain();
      feedback.gain.value = 0.18;
      delay.connect(feedback).connect(delay);

      master.connect(dryGain).connect(compressor);
      master.connect(reverb).connect(reverbGain).connect(compressor);
      master.connect(delay).connect(compressor);
      compressor.connect(context.destination);
    }

    function rememberSource(source) {
      scheduledSources.push(source);
      source.addEventListener("ended", () => {
        scheduledSources = scheduledSources.filter((item) => item !== source);
      });
    }

    function scheduleTone(frequency, startTime, duration, volume, options = {}) {
      if (!context || !master) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.type = options.type || "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);
      if (options.detune) oscillator.detune.value = options.detune;

      filter.type = "lowpass";
      filter.frequency.value = options.cutoff || 2400;
      filter.Q.value = options.q || 0.4;

      const attack = Math.min(options.attack || 0.03, duration * 0.35);
      const release = Math.min(options.release || 0.7, duration * 0.6);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), startTime + attack);
      gain.gain.setValueAtTime(Math.max(0.0002, volume * 0.78), Math.max(startTime + attack, startTime + duration - release));
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      oscillator.connect(filter).connect(gain).connect(master);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.05);
      rememberSource(oscillator);
    }

    function schedulePiano(note, startTime, duration, volume = 0.08) {
      const frequency = midiToFrequency(note);
      scheduleTone(frequency, startTime, duration, volume, {
        type: "triangle", cutoff: 3200, attack: 0.012, release: Math.min(1.2, duration * 0.7)
      });
      scheduleTone(frequency * 2, startTime + 0.006, duration * 0.72, volume * 0.22, {
        type: "sine", cutoff: 4400, attack: 0.008, release: Math.min(0.8, duration * 0.6), detune: 2
      });
    }

    function schedulePad(notes, startTime, duration, volume = 0.028) {
      notes.forEach((note, index) => {
        const frequency = midiToFrequency(note);
        scheduleTone(frequency, startTime + index * 0.025, duration, volume, {
          type: "sine", cutoff: 1450, attack: 0.65, release: 1.4, detune: index % 2 ? 4 : -4
        });
        scheduleTone(frequency / 2, startTime, duration, volume * 0.3, {
          type: "triangle", cutoff: 900, attack: 0.8, release: 1.5
        });
      });
    }

    function dailyComposition() {
      const day = state.entry.dia;
      const isBirthday = state.now.getMonth() === 6 && state.now.getDate() === 30;
      const random = seededRandom(day * 104729 + (isBirthday ? 730 : 17));

      const roots = [48, 50, 52, 53, 55, 57, 59];
      const root = isBirthday ? 53 : roots[Math.floor(random() * roots.length)];
      const tempos = [64, 68, 72, 76, 80, 84];
      const tempo = isBirthday ? 76 : tempos[Math.floor(random() * tempos.length)];
      const beat = 60 / tempo;
      const bar = beat * 4;

      const progressions = [
        [0, 5, 3, 4], [0, 3, 5, 4], [5, 3, 0, 4], [0, 4, 5, 3],
        [3, 4, 0, 5], [0, 5, 4, 3], [5, 4, 0, 3], [0, 3, 4, 0]
      ];
      const progression = isBirthday ? [0, 3, 4, 0] : progressions[Math.floor(random() * progressions.length)];
      const scale = [0, 2, 4, 5, 7, 9, 11];
      const chordShapes = {
        0: [0, 4, 7], 1: [2, 5, 9], 2: [4, 7, 11], 3: [5, 9, 12],
        4: [7, 11, 14], 5: [9, 12, 16], 6: [11, 14, 17]
      };
      const melodyPatterns = [
        [0, 2, 4, 2, 1, 2, 4, 5],
        [4, 2, 1, 0, 2, 4, 5, 4],
        [0, 1, 2, 4, 5, 4, 2, 1],
        [2, 4, 5, 6, 5, 4, 2, 0],
        [0, 4, 2, 5, 4, 2, 1, 0],
        [5, 4, 2, 1, 0, 2, 4, 2]
      ];
      const pattern = melodyPatterns[Math.floor(random() * melodyPatterns.length)];
      const title = isBirthday
        ? "Cumpleaños de mi amor"
        : `${melodyNamesA[(day - 1) % melodyNamesA.length]} ${melodyNamesB[Math.floor((day - 1) / melodyNamesA.length) % melodyNamesB.length]}`;

      return { day, root, beat, bar, progression, scale, chordShapes, pattern, random, title, isBirthday };
    }

    function scheduleComposition(startTime) {
      const song = dailyComposition();
      const bars = 8;

      for (let barIndex = 0; barIndex < bars; barIndex += 1) {
        const degree = song.progression[barIndex % song.progression.length];
        const chord = song.chordShapes[degree].map((offset) => song.root + offset);
        const barStart = startTime + barIndex * song.bar;

        schedulePad(chord, barStart, song.bar * 1.04, song.isBirthday ? 0.034 : 0.027);
        schedulePiano(chord[0] - 12, barStart, song.beat * 1.8, 0.065);

        const arp = [0, 1, 2, 1, 0, 2, 1, 2];
        arp.forEach((position, step) => {
          const note = chord[position] + (step > 3 ? 12 : 0);
          schedulePiano(note, barStart + step * song.beat / 2, song.beat * 0.72, 0.045 + (step % 4 === 0 ? 0.015 : 0));
        });

        song.pattern.forEach((scaleIndex, step) => {
          const variation = Math.floor(song.random() * 3) - 1;
          const safeIndex = Math.max(0, Math.min(song.scale.length - 1, scaleIndex + variation));
          const note = song.root + 12 + song.scale[safeIndex] + (barIndex % 4 === 3 && step > 5 ? 12 : 0);
          const rest = song.random() < 0.14 && !song.isBirthday;
          if (!rest) {
            schedulePiano(note, barStart + step * song.beat / 2, song.beat * 0.86, 0.052);
          }
        });
      }

      return { duration: bars * song.bar, title: song.title };
    }

    function stopMusic() {
      active = false;
      clearTimeout(loopTimer);
      loopTimer = null;
      scheduledSources.forEach((source) => {
        try { source.stop(); } catch {}
      });
      scheduledSources = [];
      if (master && context) {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0.0001, context.currentTime, 0.08);
      }
    }

    function startLoop() {
      if (!active || !context) return;
      if (master) {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0.24, context.currentTime, 0.12);
      }
      const startAt = context.currentTime + 0.08;
      const song = scheduleComposition(startAt);
      loopTimer = setTimeout(startLoop, Math.max(1000, (song.duration - 0.16) * 1000));
      return song.title;
    }

    return async (button) => {
      try {
        if (!context) createAudioGraph();
        await context.resume();

        if (!active) {
          active = true;
          const title = startLoop();
          button.setAttribute("aria-pressed", "true");
          button.setAttribute("aria-label", "Pausar melodía romántica del día");
          button.title = title;
          $("#soundIcon").textContent = "♫";
          showToast(`Melodía del día: ${title}`);
        } else {
          stopMusic();
          button.setAttribute("aria-pressed", "false");
          button.setAttribute("aria-label", "Activar melodía romántica del día");
          $("#soundIcon").textContent = "♪";
          showToast("Música pausada");
        }
      } catch {
        showToast("Toca de nuevo para reproducir la melodía");
      }
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


  function enableCreativeMotion() {
    const glow = document.querySelector("#cursorGlow");
    const visual = document.querySelector("#heroVisual");
    const photo = document.querySelector(".photo-shell");
    if (glow && matchMedia("(pointer:fine)").matches) {
      window.addEventListener("pointermove", (event) => {
        glow.style.left = `${event.clientX}px`;
        glow.style.top = `${event.clientY}px`;
      }, { passive: true });
    }
    if (visual && photo && matchMedia("(pointer:fine)").matches) {
      visual.addEventListener("pointermove", (event) => {
        const rect = visual.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        photo.style.transform = `rotate(${2.4 + x * 3}deg) rotateX(${-y * 4}deg) rotateY(${x * 5}deg)`;
      });
      visual.addEventListener("pointerleave", () => {
        photo.style.transform = "rotate(2.4deg) rotateX(0deg) rotateY(0deg)";
      });
    }
    document.querySelectorAll(".memory-card").forEach((card, index) => {
      card.style.setProperty("--delay", `${Math.min(index * 55, 400)}ms`);
    });
  }

  $("#footerName").textContent = content.nombre;
  $("#year").textContent = new Date().getFullYear();
  setDailyContent(); renderArchive(); renderLetter(); updateCounter(); setInterval(updateCounter, 1000); observeReveals(); enableCreativeMotion();
  setTimeout(() => showToast("Toca ♪ para escuchar la melodía romántica de hoy"), 1200);
})();
