/**
 * Horizontal scroll-snap carousel with prev/next arrows and dot indicators.
 *
 * Markup:
 *   <div class="carousel" data-carousel>
 *     <ul class="carousel__track" data-carousel-track>
 *       <li class="carousel__slide">...</li>
 *     </ul>
 *     <div class="carousel__controls">
 *       <button data-carousel-prev>...</button>
 *       <div data-carousel-dots></div>
 *       <button data-carousel-next>...</button>
 *     </div>
 *   </div>
 *
 * Behaviour: native horizontal scroll with scroll-snap does the heavy lifting;
 * JS wires up arrows (scroll by one slide) and dots (jump to a slide), and
 * mirrors the leftmost-visible slide as the active dot.
 */

export function initCarousel() {
  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
}

function setupCarousel(root) {
  const track = root.querySelector('[data-carousel-track]');
  if (!track) return;
  const slides = Array.from(track.children);
  if (!slides.length) return;

  const prevBtn = root.querySelector('[data-carousel-prev]');
  const nextBtn = root.querySelector('[data-carousel-next]');
  const dotsHost = root.querySelector('[data-carousel-dots]');

  const dots = [];
  if (dotsHost) {
    dotsHost.replaceChildren();
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1} of ${slides.length}`);
      dot.addEventListener('click', () => scrollToSlide(i));
      dotsHost.appendChild(dot);
      dots.push(dot);
    });
  }

  const scrollToSlide = (i) => {
    const target = slides[i];
    if (!target) return;
    track.scrollTo({
      left: target.offsetLeft - track.offsetLeft,
      behavior: 'smooth',
    });
  };

  const scrollByOne = (dir) => {
    const first = slides[0];
    if (!first) return;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap) || 0;
    const step = first.getBoundingClientRect().width + gap;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  prevBtn?.addEventListener('click', () => scrollByOne(-1));
  nextBtn?.addEventListener('click', () => scrollByOne(1));

  const update = () => {
    const trackLeft = track.getBoundingClientRect().left;
    let activeIndex = 0;
    let closest = Infinity;
    slides.forEach((slide, i) => {
      const dist = Math.abs(slide.getBoundingClientRect().left - trackLeft);
      if (dist < closest) {
        closest = dist;
        activeIndex = i;
      }
    });
    dots.forEach((d, i) => {
      d.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
      d.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
    });
    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    if (prevBtn) prevBtn.disabled = atStart;
    if (nextBtn) nextBtn.disabled = atEnd;
  };

  let rafId = null;
  const queueUpdate = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  };

  track.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);

  update();
}
