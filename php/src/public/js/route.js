export const route = {
  "/": {
    html: "/pages/home.html",
    js: [
      { path: "./api/api_home.js", func: ["LoadHome"] },
      { path: "./lib/slider.js", func: ["initHeroSlider"] },
    ],
    css: [
      "/css/general/style_navbar.css",
      "/css/style.css",
      "/css/home/style_sliding_card.css",
      "/css/home/style_home.css",
    ],
    useNavbar: true,
  },
  "/home": {
    html: "/pages/home.html",
    js: [
      { path: "./api/api_home.js", func: ["LoadHome"] },
      { path: "./lib/slider.js", func: ["initHeroSlider"] },
    ],
    css: [
      "/css/general/style_navbar.css",
      "/css/home/style_sliding_card.css",
      "/css/home/style_home.css",
    ],
    useNavbar: true,
  },
  "/login": {
    html: "/pages/login.html",
    js: [],
    css: [],
    useNavbar: false,
  },
  "/register": {
    html: "/pages/register.html",
    js: [],
    css: [],
    useNavbar: false,
  },
};
