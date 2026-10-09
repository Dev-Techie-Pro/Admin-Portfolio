function focusMainContent() {
  if (typeof document === "undefined") return;
  const main = document.getElementById("pa-main-content") || document.querySelector("main") || document.querySelector(".pa-main");
  if (main) {
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: true });
  }
}
export {
  focusMainContent
};
//# sourceMappingURL=focusMain.js.map
