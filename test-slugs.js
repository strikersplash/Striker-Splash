// Quick test to check for John Does
const names = ["John Doe", "John Doe", "Jane Smith", "Bob Wilson"];

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const slugMap = {};
names.forEach((name, index) => {
  const slug = generateSlug(name);
  if (!slugMap[slug]) slugMap[slug] = [];
  slugMap[slug].push({ id: index + 1, name });
});

console.log("Slug collisions found:");
Object.entries(slugMap).forEach(([slug, players]) => {
  if (players.length > 1) {
    console.log(
      `${slug}: ${players.map((p) => `${p.name} (ID: ${p.id})`).join(", ")}`
    );
  }
});
