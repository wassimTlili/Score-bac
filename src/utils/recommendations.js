// utils/recommendations.js
export function getRecommendations({
  data,
  userScore,
  selectedHub = null,
  selectedUniversity = null,
  selectedLicence = null,
  selectedBacType = null
}) {
  return data.flatMap(entry => {
    if (selectedHub && entry.hub !== selectedHub) return [];
    if (selectedUniversity && entry.university !== selectedUniversity) return [];
    if (selectedLicence && entry.licence !== selectedLicence) return [];
    // Only keep bacScores matching the selectedBacType
    return entry.bacScores
      .filter(bac =>
        (!selectedBacType || bac.bacType === selectedBacType) &&
        bac.score2024 !== null &&
        userScore >= bac.score2024 - 20 &&
        userScore <= bac.score2024 + 10
      )
      .map(bac => ({
        hub: entry.hub,
        university: entry.university,
        code: entry.code,
        licence: entry.licence,
        bacType: bac.bacType,
        score2024: bac.score2024,
        score2023: bac.score2023,
        score2022: bac.score2022
      }));
  });
}