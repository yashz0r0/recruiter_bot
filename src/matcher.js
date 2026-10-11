/**
 * Recruiter Bot - Core Matching Engine
 *
 * EXPLICIT MODEL ASSUMPTIONS (per assignment specification):
 * 1. Skill coverage weight is fixed at 60% (0.60).
 * 2. Experience fit weight is fixed at 30% (0.30).
 * 3. Availability fit weight is fixed at 10% (0.10).
 * 4. Availability baseline scores:
 *    - 'Immediate'   -> 100
 *    - '2 weeks'     -> 60
 *    - 'Not looking' -> 0
 * 5. Culture keywords and personality traits are stored in the database
 *    for human review, but intentionally excluded from algorithmic scoring
 *    to maintain a deterministic, explainable, and lightweight scoring system.
 *
 * NOTE: These weights and point values are heuristic engineering assumptions,
 * NOT learned statistical or machine-learned predictions.
 */

const AVAILABILITY_POINTS = {
  immediate: 100,
  '2 weeks': 60,
  'not looking': 0
};

/**
 * Calculates deterministic match score and explanatory reason
 * between a single candidate and a single job.
 *
 * @param {Object} candidate - Candidate record with skills array
 * @param {Object} job - Job record with required_skills array
 * @returns {Object} { score, reason, breakdown }
 */
function calculateMatch(candidate, job) {
  const candidateSkills = (candidate.skills || []).map(s => s.trim().toLowerCase());
  const requiredSkills = (job.required_skills || []).map(s => s.trim().toLowerCase());

  // 1. Skill Coverage (60% weight)
  const matchedSkills = [];
  for (const reqSkill of requiredSkills) {
    if (candidateSkills.includes(reqSkill)) {
      matchedSkills.push(reqSkill);
    }
  }

  const totalRequired = requiredSkills.length;
  const skillCoverage = totalRequired === 0
    ? 100
    : (matchedSkills.length / totalRequired) * 100;

  // 2. Experience Fit (30% weight)
  const candidateExp = Number(candidate.experience_years) || 0;
  const minExp = Number(job.min_experience) || 0;

  const experienceFit = minExp <= 0
    ? 100
    : Math.min(candidateExp / minExp, 1) * 100;

  // 3. Availability Score (10% weight)
  const availKey = String(candidate.availability || '').trim().toLowerCase();
  const availabilityScore = AVAILABILITY_POINTS.hasOwnProperty(availKey)
    ? AVAILABILITY_POINTS[availKey]
    : 0;

  // 4. Combined Deterministic Score
  const rawScore = (0.60 * skillCoverage) + (0.30 * experienceFit) + (0.10 * availabilityScore);
  const roundedScore = Math.round(rawScore * 100) / 100;

  // 5. Plain English Reason
  const matchedSkillsText = matchedSkills.length > 0 ? matchedSkills.join(', ') : 'none';
  const reason = `Matched ${matchedSkills.length}/${totalRequired} required skills (${matchedSkillsText}). ` +
    `Experience: ${candidateExp}/${minExp} yrs (${Math.round(experienceFit)}% fit). ` +
    `Availability: ${candidate.availability} (${availabilityScore} pts).`;

  return {
    score: roundedScore,
    reason,
    breakdown: {
      skill_coverage: Math.round(skillCoverage * 100) / 100,
      experience_fit: Math.round(experienceFit * 100) / 100,
      availability_score: availabilityScore,
      matched_skills: matchedSkills,
      missing_skills: requiredSkills.filter(s => !candidateSkills.includes(s))
    }
  };
}

module.exports = {
  calculateMatch,
  AVAILABILITY_POINTS
};
