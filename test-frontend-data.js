// Test frontend player selection and submission
console.log("=== TESTING PLAYER SELECTION ===");

// Simulate what should happen when creating a competition
const mockSelectedPlayers = [
  { id: 1, name: "John Doe" },
  { id: 3, name: "Billy Kid" },
  { id: 9, name: "Jane Doe" },
];

console.log("Mock selected players:", mockSelectedPlayers);
console.log(
  "Mapped participant IDs:",
  mockSelectedPlayers.map((p) => p.id)
);

const mockCompetitionData = {
  type: "individual",
  name: `Individual Competition (${mockSelectedPlayers.length} players)`,
  cost: 10.0,
  kicks_per_player: 5,
  max_participants: 10,
  description: "Test competition",
  participants: mockSelectedPlayers.map((p) => p.id),
};

console.log("Mock competition data:", mockCompetitionData);
console.log("Participants array:", mockCompetitionData.participants);
console.log("Participants length:", mockCompetitionData.participants.length);
