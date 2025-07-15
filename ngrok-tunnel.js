// ngrok-tunnel.js

const ngrok = require("ngrok");

(async function () {
  try {
    const url = await ngrok.connect({
      addr: 4200,
      authtoken: "2zJh92QucYwv1XyA9N8exV2SeNl_5aywgnjhNDyi3R2K5SKE1" // Може и да го пропуснеш, ако не ползваш акаунт
    });

    console.log("\n🔗 Публичен линк: ", url);
    console.log("⏳ Изчакай Angular да се зареди напълно преди да го отвориш.");
  } catch (err) {
    console.error("❌ Грешка при стартиране на ngrok тунел:", err);
  }
})();
