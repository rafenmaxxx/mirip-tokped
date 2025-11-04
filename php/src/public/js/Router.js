import { GET } from "./api/api.js";
import { LoadComponent, RemoveComponent } from "./util/component_loader.js";

export class Router {
  constructor(appElementId, devMode = true) {
    this.app = document.getElementById(appElementId);
    this.devMode = devMode;
    this.navBarInit = false;
    this.moduleCache = {};
    this.cssCache = new Set();
  }

  async loadView(path) {
    GET(
      "/api/path",
      { path },
      (data) => {
        if (!data || data.status !== "success" || !data.data) {
          this.navigateTo("/unauthorized");
          return;
        }

        const { html_content, metadata: route } = data.data;
        try {
          this.app?.classList.remove("visible");
          this.loadCSS(route.css || [], () => {
            this.app.innerHTML = html_content;
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
          });

          this.handleFunc(route.js);
        } catch (err) {
          console.error("Error loading view:", err);
          this.app.innerHTML = `<h1>Error loading page</h1>`;
        }
      },
      (error) => {
        if (error) {
          console.error("API call to /api/path failed:", error);
          this.app.innerHTML = `<h1>Network Error</h1>`;
        }
      }
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
    const importPath = this.devMode ? `${path}?v=${Date.now()}` : path;

    if (!this.devMode) {
      if (!this.moduleCache[path]) {
        const module = await import(importPath);
        this.moduleCache[path] = module;
        console.log(`Loaded module: ${path}`);
      } else {
        console.log(`Using cached module: ${path}`);
      }
    } else {
      const module = await import(importPath);
      console.log(`Loaded fresh module (devMode): ${importPath}`);
      this.moduleCache[path] = module;
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

  loadCSS(cssPaths, callback) {
    if (!cssPaths || !cssPaths.length) {
      callback?.();
      return;
    }

    let loadedCount = 0;
    const total = cssPaths.length;

    cssPaths.forEach((cssPath) => {
      let finalPath = this.devMode ? cssPath + "?v=" + Date.now() : cssPath;

      // Sudah pernah dimuat → skip
      if (
        [...document.styleSheets].some(
          (s) => s.href && s.href.includes(cssPath)
        )
      ) {
        loadedCount++;
        if (loadedCount === total) callback?.();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = finalPath;

      link.onload = () => {
        loadedCount++;
        console.log("Loaded CSS:", finalPath);
        if (loadedCount === total) callback?.();
      };

      link.onerror = () => {
        loadedCount++;
        console.warn("Gagal memuat CSS:", finalPath);
        if (loadedCount === total) callback?.();
      };

      document.head.appendChild(link);
    });
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
