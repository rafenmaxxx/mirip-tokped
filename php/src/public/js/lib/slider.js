export function initHeroSlider(containerSelector = ".hero-slider") {
  const slider = document.querySelector(containerSelector);
  if (!slider) {
    console.warn(
      `Hero slider dengan selector '${containerSelector}' tidak ditemukan.`
    );
    return;
  }
}
