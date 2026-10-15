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

  function init() {
    initLenis();
    initCardStacks();
    initDirectionalButtonHover();

    if (typeof gsap === "undefined" || typeof SplitText === "undefined") {
      console.warn("[yellowlime] GSAP of SplitText niet gevonden. Staan ze aan in Webflow → Site settings → GSAP?");
      return;
    }
    gsap.registerPlugin(SplitText);
    document.fonts.ready.then(initMainButtons);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
