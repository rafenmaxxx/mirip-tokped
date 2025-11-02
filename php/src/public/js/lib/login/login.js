export function InitLogin() {

  const toggleButtons = document.querySelectorAll(".toggle-password");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById("password");
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "hide";
      } else {
        input.type = "password";
        btn.textContent = "show";
      }
    });
  });
}