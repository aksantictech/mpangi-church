console.log(`
Colle ce script dans la console du navigateur sur http://localhost:3000 :

(async () => {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    console.log("Service workers supprimés:", regs.length);
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    console.log("Caches supprimés:", keys);
  }

  localStorage.clear();
  sessionStorage.clear();

  location.reload();
})();
`);
