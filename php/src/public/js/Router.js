import { LoadComponent, RemoveComponent } from "./util/component_loader.js";

export class Router {
  constructor(appElementId) {
    this.app = document.getElementById(appElementId);

    this.routes = {
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

    this.moduleCache = {};
    this.cssCache = new Set();
  }

  async loadView(path) {
    const route = this.routes[path] || { html: "/pages/404.html" };
    try {
      const res = await fetch(route.html);
      if (res.status === 401) {
        this.navigateTo("/login");
        return;
      }
      if (!res.ok) {
        this.app.innerHTML = `<h1>404 - Page Not Found</h1>`;
        return;
      }

      if (route.useNavbar) {
        await LoadComponent("navbar", "/components/general/navbar.html");
      } else {
        await RemoveComponent("navbar");
      }

      const html = await res.text();
      this.app.innerHTML = html;

      await this.loadCSS(route.css || []);
      await this.handleFunc(path);
    } catch (err) {
      console.error("Error loading view:", err);
      this.app.innerHTML = `<h1>Error loading page</h1>`;
    }
  }

  async handleFunc(path) {
    const route = this.routes[path];
    if (!route || !route.js) return;

    for (const js of route.js) {
      const { path: jsPath, func } = js;
      await this.loadModuleOnce(jsPath, func);
    }
  }

  async loadModuleOnce(path, funcNames = []) {
    if (!this.moduleCache[path]) {
      const module = await import(path);
      this.moduleCache[path] = module;
      console.log(`Loaded module: ${path}`);
    } else {
      console.log(`Using cached module: ${path}`);
    }

    const module = this.moduleCache[path];
    for (const funcName of funcNames) {
      if (typeof module[funcName] === "function") {
        try {
          await module[funcName]();
        } catch (err) {
          console.error(`Error executing ${funcName} in ${path}:`, err);
        }
      } else {
        console.warn(`Function ${funcName} not found in ${path}`);
      }
    }
  }

  async loadCSS(cssPaths) {
    for (const cssPath of cssPaths) {
      if (!this.cssCache.has(cssPath)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssPath;
        document.head.appendChild(link);
        this.cssCache.add(cssPath);
        console.log(`Loaded CSS: ${cssPath}`);
      }
    }
  }

  handleRoute() {
    const path = window.location.pathname;
    this.loadView(path);
  }

  navigateTo(route) {
    if (window.location.pathname !== route) {
      history.pushState({}, "", route);
      this.handleRoute();
    } else {
      this.handleFunc(route);
    }
  }

  init() {
    document.body.addEventListener("click", (e) => {
      const target = e.target.closest("a");
      if (target && target.hasAttribute("data-link")) {
        e.preventDefault();
        const route = target.getAttribute("href");
        this.navigateTo(route);
      }
    });

    window.addEventListener("popstate", () => this.handleRoute());
    this.handleRoute();
  }
}
