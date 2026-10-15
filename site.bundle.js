/*
 * Yellowlime – interacties
 * Vereist: GSAP core + SplitText (via Webflow Site settings → GSAP)
 *
 * Componenten:
 *  - Main button (.main_button_wrap): slanted text reveal, vijfhoek-morph, pijl-loop
 *  - Underline link ([data-underline-link]): puur CSS, zie yellowlime.css
 */

(() => {
  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------
  const MAIN_BUTTON = {
    duration: 0.5,        // duur per letter
    stagger: 0.012,       // vertraging tussen letters
    ease: "expo.out",     // snel weg, zacht landen
    move: 1.05,           // afstand als factor van de buttonhoogte (1 = precies eruit)
    drift: 12,            // zijwaartse beweging (xPercent per letter)
    rotate: 10,           // schuine hoek in graden
    origin: "50% 200%",   // draaipunt onder de letter, geeft de boog
    arrowOut: 0.16,       // pijl weg naar rechts
    arrowIn: 0.3,         // nieuwe pijl van links
    // vijfhoek-morph: altijd 5 punten, zelfde volgorde
    pentRest:  "polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)",
    pentHover: "polygon(56% 2%, 100% 44%, 76% 98%, 14% 94%, 2% 32%)",
    pentRotate: 6         // extra draai bij hover, bovenop de -12deg
  };

  // ---------------------------------------------------------------------------
  // Main button
  // ---------------------------------------------------------------------------
  function initMainButtons() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll(".main_button_wrap").forEach((btn) => {
      if (btn.dataset.mainButtonInit) return; // niet dubbel initialiseren
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

      // beginstand
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

      // muis: hover
      btn.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") enter(); });
      btn.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") leave(); });

      // toetsenbord: alleen bij zichtbare focus (tab), niet bij klikken
      btn.addEventListener("focus", () => { if (btn.matches(":focus-visible")) enter(); });
      btn.addEventListener("blur", () => { if (!btn.matches(":hover")) leave(); });
    });
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function init() {
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
