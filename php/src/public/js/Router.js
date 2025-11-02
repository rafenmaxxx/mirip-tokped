import { GET, GETMODULE } from "./api/api.js";
import { LoadComponent, RemoveComponent } from "./util/component_loader.js";

export class Router {
  constructor(appElementId, devMode = true) {
    // devMode = true untuk development
    this.app = document.getElementById(appElementId);
    this.devMode = devMode; // REMOVE IN PRODUCTION
    this.navBarInit = false;
    this.moduleCache = {};
    this.cssCache = new Set();
  }

  async loadView(path) {
    GET(
      "/api/path",
      { path },
      (data) => {
        // jika route tidak ditemukan atau user tidak punya akses
        if (!data || data.status !== "success" || !data.data) {
          this.navigateTo("/unauthorized");
          return;
        }

        const route = data.data;

        try {
          // load HTML
          const htmlPath = this.devMode
            ? `${route.html}?v=${Date.now()}`
            : route.html;

          GETMODULE(
            htmlPath,
            {},
            (html) => {
              this.app.innerHTML = html;
              // Navbar
              if (route.useNavbar && !this.navBarInit) {
                this.navBarInit = true;
                LoadComponent(
                  "navbar",
                  this.devMode
                    ? `/components/general/navbar.html?v=${Date.now()}`
                    : "/components/general/navbar.html",
                  () => {
                    this.loadModuleOnce("./lib/general/navbar.js", [
                      "InitNavbar",
                    ]);
                    this.loadCSS(["/css/general/style_navbar.css"]);
                  }
                );
              } else if (!route.useNavbar) {
                RemoveComponent("navbar");
                this.navBarInit = false;
              }
              this.loadCSS(route.css || []);
              this.handleFunc(route.js);
            },
            () => {
              this.app.innerHTML = `<h1>404 - Page Not Found</h1>`;
            }
          );
        } catch (err) {
          console.error("Error loading view:", err);
          this.app.innerHTML = `<h1>Error loading page</h1>`;
        }
      },
      () => {}
    );
  }

  async handleFunc(jspath) {
    if (!jspath) return;

    for (const js of jspath) {
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
    const fullPath = window.location.pathname + window.location.search;
    if (fullPath !== route) {
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
