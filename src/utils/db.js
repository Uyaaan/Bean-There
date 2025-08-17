const DB_KEY = "bean-there/db";

export function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return { cafes: [], images: [] };
  try { return JSON.parse(raw); } catch { return { cafes: [], images: [] }; }
}

export function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function upsertCafe(cafe) {
  const db = loadDB();
  const idx = db.cafes.findIndex(c => c.id === cafe.id);
  if (idx === -1) db.cafes.push(cafe); else db.cafes[idx] = cafe;
  saveDB(db);
}

export function deleteCafe(cafeId) {
  const db = loadDB();
  db.cafes = db.cafes.filter(c => c.id !== cafeId);
  db.images = db.images.filter(img => img.cafeId !== cafeId);
  saveDB(db);
}

export function upsertImage(img) {
  const db = loadDB();
  const idx = db.images.findIndex(i => i.id === img.id);
  if (idx === -1) db.images.push(img); else db.images[idx] = img;
  saveDB(db);
}

export function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}