import { route } from "./route.js";
import { LoadComponent, RemoveComponent } from "./util/component_loader.js";

export class Router {
  constructor(appElementId, devMode = true) {
    // devMode = true untuk development
    this.app = document.getElementById(appElementId);
    this.devMode = devMode; // REMOVE IN PRODUCTION

    this.routes = route;

    this.moduleCache = {};
    this.cssCache = new Set();
  }

  async loadView(path) {
    const route = this.routes[path] || { html: "/pages/404.html" };
    try {
      // Tambahkan cache-buster saat devMode aktif
      const htmlPath = this.devMode
        ? `${route.html}?v=${Date.now()}` // REMOVE IN PRODUCTION
        : route.html;

      const res = await fetch(htmlPath, {
        cache: this.devMode ? "no-store" : "default",
      }); // REMOVE IN PRODUCTION

      if (res.status === 401) {
        this.navigateTo("/login");
        return;
      }
      if (!res.ok) {
        this.app.innerHTML = `<h1>404 - Page Not Found</h1>`;
        return;
      }

      if (route.useNavbar) {
        await LoadComponent(
          "navbar",
          this.devMode
            ? `/components/general/navbar.html?v=${Date.now()}`
            : "/components/general/navbar.html" // REMOVE IN PRODUCTION
        );
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
    // Tambahkan cache-buster untuk development
    const importPath = this.devMode ? `${path}?v=${Date.now()}` : path; // REMOVE IN PRODUCTION

    // Reset module cache tiap loadView jika devMode
    if (!this.devMode) {
      if (!this.moduleCache[path]) {
        const module = await import(importPath);
        this.moduleCache[path] = module;
        console.log(`Loaded module: ${path}`);
      } else {
        console.log(`Using cached module: ${path}`);
      }
    } else {
      // Development: selalu import fresh
      const module = await import(importPath);
      console.log(`Loaded fresh module (devMode): ${importPath}`);
      this.moduleCache[path] = module; // optional: bisa dihapus juga
    }

    const module = this.moduleCache[path];
    for (const funcName of funcNames) {
      if (typeof module[funcName] === "function") {
        try {
          await module[funcName]();
        } catch (err) {
          console.error(`Error executing ${funcName} in ${importPath}:`, err);
        }
      } else {
        console.warn(`Function ${funcName} not found in ${importPath}`);
      }
    }
  }

  async loadCSS(cssPaths) {
    for (const cssPath of cssPaths) {
      let finalPath = cssPath;
      if (this.devMode) {
        finalPath += `?v=${Date.now()}`; // REMOVE IN PRODUCTION
      }
      if (!this.cssCache.has(finalPath)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = finalPath;
        document.head.appendChild(link);
        this.cssCache.add(finalPath);
        console.log(`Loaded CSS: ${finalPath}`);
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
