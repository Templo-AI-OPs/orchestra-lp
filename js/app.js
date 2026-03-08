document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURATION ---
    const FRAME_COUNT = 121;
    const FRAME_SPEED = 1.25; // Slower acceleration to make video last until section 7
    const IMAGE_SCALE = 1.05; // Set to 1.05 to ensure full cover and no black border on left
    
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scrollContainer = document.getElementById('scroll-container');
    const frames = [];
    let currentFrame = -1;
    let framesLoaded = 0;

    // --- 2. LENIS SMOOTH SCROLL ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });
    
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // --- 3. RESIZE HANDLING ---
    function resizeCanvas() {
        const wrap = document.querySelector('.canvas-wrap');
        canvas.width = wrap.clientWidth * window.devicePixelRatio;
        canvas.height = wrap.clientHeight * window.devicePixelRatio;
        if (currentFrame >= 0) drawFrame(currentFrame);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- 4. PRELOAD FRAMES ---
    const loaderPercent = document.getElementById('loader-percent');
    const loaderBar = document.getElementById('loader-bar');
    const loader = document.getElementById('loader');

    function pad(num, size) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    function checkLoadProgress() {
        framesLoaded++;
        const percent = Math.floor((framesLoaded / FRAME_COUNT) * 100);
        loaderPercent.innerText = `${percent}%`;
        loaderBar.style.width = `${percent}%`;

        if (framesLoaded === FRAME_COUNT) {
            gsap.to(loader, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
                onComplete: () => {
                    loader.style.display = 'none';
                    initScrollTriggers(); // Initialize animations once loaded
                }
            });
            // Initial draw
            drawFrame(0);
        }
    }

    // Load first frame immediately
    for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.onload = checkLoadProgress;
        img.onerror = checkLoadProgress; // Ensure it proceeds even if missing one
        img.src = `frames/frame_${pad(i, 4)}.jpg`;
        frames.push(img);
    }

    // --- 5. CANVAS RENDERER ---
    function drawFrame(index) {
        const img = frames[index];
        if (!img || !img.complete) return;
        
        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        
        // Use max to cover the area like background-size: cover, but scaled by IMAGE_SCALE
        const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
        const dw = iw * scale;
        const dh = ih * scale;
        
        // Align image to the left of the canvas (dx = 0) so there's no gap between text and video
        const dx = 0; 
        const dy = (ch - dh) / 2;
        
        // Fill bg with black
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, cw, ch);
        
        // Draw image
        ctx.drawImage(img, dx, dy, dw, dh);
    }

    // --- 6. SCROLL BINDINGS ---
    function initScrollTriggers() {
        
        // Canvas Frame Scrolling
        ScrollTrigger.create({
            trigger: scrollContainer,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
                const index = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
                if (index !== currentFrame) {
                    currentFrame = index;
                    requestAnimationFrame(() => drawFrame(currentFrame));
                }
            }
        });

        // Hero section fade and Canvas Wipe
        const canvasWrap = document.querySelector('.canvas-wrap');
        const heroSection = document.querySelector('.hero-standalone');
        
        canvasWrap.style.clipPath = `circle(0% at 50% 50%)`;
        
        ScrollTrigger.create({
            trigger: scrollContainer,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
                const p = self.progress;
                heroSection.style.opacity = Math.max(0, 1 - p * 15);
                
                const wipeProgress = Math.min(1, Math.max(0, (p - 0.01) / 0.06));
                const radius = wipeProgress * 75;
                canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;
            }
        });

        const overlay = document.getElementById("dark-overlay");

        // Section Animations
        document.querySelectorAll('.scroll-section').forEach(section => {
            const enter = parseFloat(section.dataset.enter);
            const leave = parseFloat(section.dataset.leave);
            const persist = section.dataset.persist === "true";
            const animationType = section.dataset.animation;
            
            // Elements to animate
            const children = section.querySelectorAll(
                ".section-label, .section-heading, .section-subheading, .section-body, .system-note, .cta-button, .hero-heading .word, .hero-tagline, .stat, .marquee-text, .cta-bottom h2, .stats-list li"
            );
            if (children.length === 0) return;

            // Setup Timeline
            const tl = gsap.timeline({ paused: true });
            
            switch (animationType) {
                case "fade-up":
                    tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" });
                    break;
                case "slide-left":
                    tl.from(children, { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
                    break;
                case "slide-right":
                    tl.from(children, { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: "power3.out" });
                    break;
                case "scale-up":
                    tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: "power2.out" });
                    break;
                case "stagger-up":
                    tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" });
                    break;
                case "clip-reveal":
                    tl.from(children, { clipPath: "inset(100% 0 0 0)", opacity: 0, stagger: 0.15, duration: 1.2, ease: "power4.inOut" });
                    break;
            }

            section.style.position = 'fixed';
            section.style.top = '0';
            section.style.left = '0';

            ScrollTrigger.create({
                trigger: scrollContainer,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
                onUpdate: (self) => {
                    const p = self.progress * 100;
                    
                    // Strict check for visibility to avoid overlap
                    const isVisible = p >= enter && p < leave;
                    
                    if (isVisible) {
                        section.style.display = 'flex';
                        if (!section.played) {
                            tl.play();
                            section.played = true;
                        }
                        
                        // Fade out near the end of the section
                        if (!persist) {
                            const fadeOutStart = leave - 2; // last 2%
                            if (p > fadeOutStart) {
                                section.style.opacity = Math.max(0, 1 - (p - fadeOutStart) / 2);
                            } else {
                                section.style.opacity = 1;
                            }
                        }
                    } else {
                        if (!persist) {
                            section.style.display = 'none';
                            section.style.opacity = 1;
                            tl.progress(0).pause();
                            section.played = false;
                        } else {
                            if (p >= leave) {
                                section.style.display = 'flex';
                                section.style.opacity = 1;
                            } else {
                                section.style.display = 'none';
                                section.style.opacity = 1;
                                tl.progress(0).pause();
                                section.played = false;
                            }
                        }
                    }
                    
                    // Handle specific dark overlay for stats and CTA
                    if (section.classList.contains('section-stats')) {
                        if (p >= enter - 5) {
                            const overlayP = Math.min(1, (p - (enter - 5)) / 5);
                            overlay.style.opacity = overlayP * 0.85;
                        } else {
                            overlay.style.opacity = 0;
                        }
                    }
                }
            });
        });

        // Initial check to position hero correctly
        document.querySelector('.hero-standalone').style.position = 'fixed';
        gsap.to('.hero-heading .word', { y: 0, opacity: 1, stagger: 0.1, duration: 1, ease: "power3.out" });

        // Marquee Animation
        document.querySelectorAll(".marquee-wrap").forEach(el => {
            const speed = parseFloat(el.dataset.scrollSpeed) || -25;
            gsap.to(el.querySelector(".marquee-text"), {
                xPercent: speed,
                ease: "none",
                scrollTrigger: { 
                    trigger: scrollContainer, 
                    start: "top top", 
                    end: "bottom bottom", 
                    scrub: true 
                }
            });
        });

    }

});
