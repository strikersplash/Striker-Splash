// Quick test of timezone calculation
const today = new Date();
const localToday = new Date(
  today.getTime() - today.getTimezoneOffset() * 60000
);
const todayString = localToday.toISOString().split("T")[0];

console.log("UTC Date:", new Date().toISOString());
console.log("UTC Date String:", new Date().toISOString().split("T")[0]);
console.log("Timezone offset (minutes):", today.getTimezoneOffset());
console.log("Local adjusted date:", localToday.toISOString());
console.log("Local date string:", todayString);
