export function initHeroSlider(containerSelector = ".hero-slider") {
  const slider = document.querySelector(containerSelector);
  if (!slider) return;

  const track = slider.querySelector(".hero-slider__track");
  const slides = slider.querySelectorAll(".hero-slide");
  const btnPrev = slider.querySelector(".hero-slider__btn.prev");
  const btnNext = slider.querySelector(".hero-slider__btn.next");

  let currentIndex = 0;

  function updateSlide() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  btnPrev.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlide();
  });

  btnNext.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlide();
  });

  // Optional: auto slide
  let autoSlide = setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlide();
  }, 5000);

  // Pause on hover
  slider.addEventListener("mouseenter", () => clearInterval(autoSlide));
  slider.addEventListener("mouseleave", () => {
    autoSlide = setInterval(() => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlide();
    }, 5000);
  });

  updateSlide();
}
