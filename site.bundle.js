(() => {
  const MAIN_BUTTON = {
    duration: 0.5,
    stagger: 0.012,
    ease: "expo.out",
    move: 1.05,
    drift: 12,
    rotate: 10,
    origin: "50% 200%",
    arrowOut: 0.16,
    arrowIn: 0.3,
    pentRest:  "polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)",
    pentHover: "polygon(56% 2%, 100% 44%, 76% 98%, 14% 94%, 2% 32%)",
    pentRotate: 6
  };

  const FLICK_CARDS = {
    brightness: [1, 0.7, 0.5, 0.35]
  };

  function initLenis() {
    if (typeof Lenis === "undefined") {
      console.warn("[yellowlime] Lenis niet gevonden.");
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1
    });

    if (typeof gsap !== "undefined") {
      if (typeof ScrollTrigger !== "undefined") {
        lenis.on("scroll", ScrollTrigger.update);
      }
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    window.lenis = lenis;
  }

  function initCardStacks() {
    const stacks = document.querySelectorAll(".card-stack");
    if (!stacks.length) return;

    const update = () => {
      stacks.forEach((stack) => {
        const items = [...stack.querySelectorAll(":scope > .card-stack__item")];
        if (!items.length) return;
        const gap = parseFloat(getComputedStyle(stack).rowGap) || 0;
        const height = Math.max(...items.map((item) => item.offsetHeight));
        stack.style.setProperty("--stack-row", `${height + gap}px`);
        stack.style.setProperty("--stack-count", items.length);
      });
    };

    update();

    const ro = new ResizeObserver(update);
    stacks.forEach((stack) => {
      stack.querySelectorAll(":scope > .card-stack__item").forEach((item) => ro.observe(item));
    });
  }

  function initMainButtons() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll(".main_button_wrap").forEach((btn) => {
      if (btn.dataset.mainButtonInit) return;
      btn.dataset.mainButtonInit = "true";

      const block = btn.querySelector(".main_button");
      const labels = btn.querySelectorAll(".main_button_label");
      const bg = btn.querySelector(".main_button_bg");
      const arrow = btn.querySelector(".main_button_arrow");
      const pent = btn.querySelector(".main_button_pent");
      if (!block || labels.length < 2 || !bg) return;

      const c = MAIN_BUTTON;
      const speed = reduce ? 0.25 : 1;
      const dist = () => block.offsetHeight * c.move;
      const outChars = new SplitText(labels[0], { type: "chars" }).chars;
      const inChars = new SplitText(labels[1], { type: "chars" }).chars;

      gsap.set([...outChars, ...inChars], { transformOrigin: c.origin });
      gsap.set(inChars, { xPercent: -c.drift, y: dist(), rotation: -c.rotate });
      gsap.set(labels[1], { visibility: "visible" });
      gsap.set(bg, {
        x: 0, y: 0, xPercent: 0, yPercent: 200,
        rotation: -30, transformOrigin: "50% 0%", visibility: "visible"
      });
      if (pent) gsap.set(pent, { clipPath: c.pentRest, rotation: -12 });

      let active = false;
      let arrowTl;

      const enter = () => {
        if (active) return;
        active = true;
        const d = c.duration * speed;

        gsap.to(bg, { yPercent: 0, rotation: 0, duration: d + 0.05, ease: c.ease, overwrite: true });
        gsap.to(outChars, {
          xPercent: c.drift, y: -dist(), rotation: c.rotate,
          duration: d, ease: c.ease, stagger: c.stagger, overwrite: true
        });
        gsap.to(inChars, {
          xPercent: 0, y: 0, rotation: 0,
          duration: d, ease: c.ease, stagger: c.stagger, delay: 0.04, overwrite: true
        });

        if (pent) {
          gsap.to(pent, {
            clipPath: c.pentHover, rotation: -12 + c.pentRotate,
            duration: d + 0.1, ease: c.ease, overwrite: true
          });
        }

        if (arrow) {
          if (arrowTl) arrowTl.kill();
          arrowTl = gsap.timeline()
            .to(arrow, { xPercent: 160, opacity: 0, duration: c.arrowOut * speed, ease: "power2.in" })
            .set(arrow, { xPercent: -160 })
            .to(arrow, { xPercent: 0, opacity: 1, duration: c.arrowIn * speed, ease: "expo.out" });
        }
      };

      const leave = () => {
        if (!active) return;
        active = false;
        const d = c.duration * speed;

        gsap.to(bg, { yPercent: 200, rotation: -30, duration: d + 0.05, ease: c.ease, overwrite: true });
        gsap.to(outChars, {
          xPercent: 0, y: 0, rotation: 0,
          duration: d, ease: c.ease, stagger: c.stagger, delay: 0.04, overwrite: true
        });
        gsap.to(inChars, {
          xPercent: -c.drift, y: dist(), rotation: -c.rotate,
          duration: d, ease: c.ease, stagger: c.stagger, overwrite: true
        });

        if (pent) {
          gsap.to(pent, {
            clipPath: c.pentRest, rotation: -12,
            duration: d + 0.1, ease: c.ease, overwrite: true
          });
        }
      };

      btn.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") enter(); });
      btn.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") leave(); });
      btn.addEventListener("focus", () => { if (btn.matches(":focus-visible")) enter(); });
      btn.addEventListener("blur", () => { if (!btn.matches(":hover")) leave(); });
    });
  }

  function initDirectionalButtonHover() {
    document.querySelectorAll("[data-btn-hover]").forEach((button) => {
      button.addEventListener("mouseenter", handleHover);
      button.addEventListener("mouseleave", handleHover);
    });

    function handleHover(event) {
      const button = event.currentTarget;
      const buttonRect = button.getBoundingClientRect();

      const buttonWidth = buttonRect.width;
      const buttonHeight = buttonRect.height;
      const buttonCenterX = buttonRect.left + buttonWidth / 2;

      const mouseX = event.clientX;
      const mouseY = event.clientY;

      const offsetXFromLeft = ((mouseX - buttonRect.left) / buttonWidth) * 100;
      const offsetYFromTop = ((mouseY - buttonRect.top) / buttonHeight) * 100;

      let offsetXFromCenter = ((mouseX - buttonCenterX) / (buttonWidth / 2)) * 50;
      offsetXFromCenter = Math.abs(offsetXFromCenter);

      const circle = button.querySelector(".nav_button_circle");
      if (circle) {
        circle.style.left = `${offsetXFromLeft.toFixed(1)}%`;
        circle.style.top = `${offsetYFromTop.toFixed(1)}%`;
        circle.style.width = `${115 + offsetXFromCenter.toFixed(1) * 2}%`;
      }
    }
  }

  function initFlickCards() {
    const sliders = document.querySelectorAll("[data-flick-cards-init]");
    const b = FLICK_CARDS.brightness;

    sliders.forEach((slider) => {
      const list = slider.querySelector("[data-flick-cards-list]");
      if (!list) return;
      const cards = Array.from(list.querySelectorAll("[data-flick-cards-item]"));
      const total = cards.length;
      let activeIndex = 0;

      const sliderWidth = slider.offsetWidth;
      const threshold = 0.1;

      const draggers = [];
      cards.forEach((card) => {
        const dragger = document.createElement("div");
        dragger.setAttribute("data-flick-cards-dragger", "");
        card.appendChild(dragger);
        draggers.push(dragger);
      });

      slider.setAttribute("data-flick-drag-status", "grab");

      function getConfig(i, currentIndex) {
        let diff = i - currentIndex;
        if (diff > total / 2) diff -= total;
        else if (diff < -total / 2) diff += total;

        switch (diff) {
          case  0: return { x: 0,   y: 0, rot: 0,   s: 1,   o: 1, b: b[0], z: 5 };
          case  1: return { x: 25,  y: 1, rot: 10,  s: 0.9, o: 1, b: b[1], z: 4 };
          case -1: return { x: -25, y: 1, rot: -10, s: 0.9, o: 1, b: b[1], z: 4 };
          case  2: return { x: 45,  y: 5, rot: 15,  s: 0.8, o: 1, b: b[2], z: 3 };
          case -2: return { x: -45, y: 5, rot: -15, s: 0.8, o: 1, b: b[2], z: 3 };
          default: {
            const dir = diff > 0 ? 1 : -1;
            return { x: 55 * dir, y: 5, rot: 20 * dir, s: 0.6, o: 0, b: b[3], z: 2 };
          }
        }
      }

      function renderCards(currentIndex) {
        cards.forEach((card, i) => {
          const cfg = getConfig(i, currentIndex);
          let status;

          if (cfg.x === 0)        status = "active";
          else if (cfg.x === 25)  status = "2-after";
          else if (cfg.x === -25) status = "2-before";
          else if (cfg.x === 45)  status = "3-after";
          else if (cfg.x === -45) status = "3-before";
          else                    status = "hidden";

          card.setAttribute("data-flick-cards-item-status", status);
          card.style.zIndex = cfg.z;

          gsap.to(card, {
            duration: 0.6,
            ease: "elastic.out(1.2, 1)",
            xPercent: cfg.x,
            yPercent: cfg.y,
            rotation: cfg.rot,
            scale: cfg.s,
            opacity: cfg.o
          });

          gsap.to(card, {
            duration: 0.4,
            ease: "power2.out",
            filter: `brightness(${cfg.b})`
          });
        });
      }

      renderCards(activeIndex);

      if (total < 7) {
        console.log("[yellowlime] Flick cards: minimaal 7 kaarten nodig om te slepen");
        return;
      }

      let pressClientX = 0;
      let pressClientY = 0;

      Draggable.create(draggers, {
        type: "x",
        edgeResistance: 0.8,
        bounds: { minX: -sliderWidth / 2, maxX: sliderWidth / 2 },
        inertia: false,

        onPress() {
          pressClientX = this.pointerEvent.clientX;
          pressClientY = this.pointerEvent.clientY;
          slider.setAttribute("data-flick-drag-status", "grabbing");
        },

        onDrag() {
          const rawProgress = this.x / sliderWidth;
          const progress = Math.min(1, Math.abs(rawProgress));
          const direction = rawProgress > 0 ? -1 : 1;
          const nextIndex = (activeIndex + direction + total) % total;

          cards.forEach((card, i) => {
            const from = getConfig(i, activeIndex);
            const to = getConfig(i, nextIndex);
            const mix = (prop) => from[prop] + (to[prop] - from[prop]) * progress;

            gsap.set(card, {
              xPercent: mix("x"),
              yPercent: mix("y"),
              rotation: mix("rot"),
              scale: mix("s"),
              opacity: mix("o"),
              filter: `brightness(${mix("b").toFixed(3)})`
            });
          });
        },

        onRelease() {
          slider.setAttribute("data-flick-drag-status", "grab");

          const releaseClientX = this.pointerEvent.clientX;
          const releaseClientY = this.pointerEvent.clientY;
          const dragDistance = Math.hypot(releaseClientX - pressClientX, releaseClientY - pressClientY);

          const raw = this.x / sliderWidth;
          let shift = 0;
          if (raw > threshold) shift = -1;
          else if (raw < -threshold) shift = 1;

          if (shift !== 0) {
            activeIndex = (activeIndex + shift + total) % total;
          }
          renderCards(activeIndex);

          gsap.to(this.target, {
            x: 0,
            duration: 0.3,
            ease: "power1.out"
          });

          if (dragDistance < 4) {
            this.target.style.pointerEvents = "none";

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const el = document.elementFromPoint(releaseClientX, releaseClientY);
                if (el) {
                  const evt = new MouseEvent("click", {
                    view: window,
                    bubbles: true,
                    cancelable: true
                  });
                  el.dispatchEvent(evt);
                }
                this.target.style.pointerEvents = "auto";
              });
            });
          }
        }
      });
    });
  }

  function init() {
    initLenis();
    initCardStacks();
    initDirectionalButtonHover();

    if (typeof gsap === "undefined") {
      console.warn("[yellowlime] GSAP niet gevonden. Staat het aan in Webflow → Site settings → GSAP?");
      return;
    }

    if (typeof Draggable !== "undefined") {
      gsap.registerPlugin(Draggable);
      initFlickCards();
    } else {
      console.warn("[yellowlime] Draggable niet gevonden, flick cards worden overgeslagen.");
    }

    if (typeof SplitText !== "undefined") {
      gsap.registerPlugin(SplitText);
      document.fonts.ready.then(initMainButtons);
    } else {
      console.warn("[yellowlime] SplitText niet gevonden, main buttons worden overgeslagen.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
