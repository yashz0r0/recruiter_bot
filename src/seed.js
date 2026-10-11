const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./db');

const candidatesData = [
  {
    name: 'Sherlock H.',
    experience_years: 8,
    availability: 'Immediate',
    traits: ['analytical', 'blunt'],
    quirk: 'Solves problems by eliminating the impossible; occasionally insufferable in standups.',
    skills: ['deduction', 'pattern-recognition', 'forensics']
  },
  {
    name: 'Hermione G.',
    experience_years: 4,
    availability: '2 weeks',
    traits: ['detail-oriented', 'overachiever'],
    quirk: 'Reads the entire documentation before writing a single line of code.',
    skills: ['research', 'time-management', 'public-speaking']
  },
  {
    name: 'Tony S.',
    experience_years: 12,
    availability: 'Not looking',
    traits: ['confident', 'innovative'],
    quirk: 'Ships an MVP overnight, refuses to write tests.',
    skills: ['systems-design', 'rapid-prototyping', 'leadership']
  },
  {
    name: 'Leslie K.',
    experience_years: 6,
    availability: 'Immediate',
    traits: ['tenacious', 'organized'],
    quirk: 'Has a binder for everything, including the binder.',
    skills: ['project-management', 'stakeholder-management', 'public-speaking']
  },
  {
    name: 'Ron S.',
    experience_years: 15,
    availability: 'Not looking',
    traits: ['stubborn', 'principled'],
    quirk: 'Refuses to use more than one monitor.',
    skills: ['woodworking', 'minimalism', 'negotiation']
  },
  {
    name: 'Rick S.',
    experience_years: 20,
    availability: 'Immediate',
    traits: ['genius', 'reckless'],
    quirk: 'Solution works, mechanism deeply concerning.',
    skills: ['systems-design', 'rapid-prototyping', 'chemistry']
  },
  {
    name: 'Elle W.',
    experience_years: 3,
    availability: 'Immediate',
    traits: ['optimistic', 'sharp'],
    quirk: 'Underestimated in every standup, correct in every retro.',
    skills: ['persuasion', 'research', 'public-speaking']
  },
  {
    name: 'MacGyver',
    experience_years: 10,
    availability: '2 weeks',
    traits: ['calm', 'improviser'],
    quirk: 'Fixes production outages with duct tape and a paperclip metaphor.',
    skills: ['rapid-prototyping', 'resourcefulness', 'chemistry', 'systems-design']
  },
  {
    name: 'Sheldon C.',
    experience_years: 9,
    availability: 'Immediate',
    traits: ['rigid', 'brilliant'],
    quirk: 'Correct 95% of the time, insufferable 100% of the time.',
    skills: ['theoretical-analysis', 'pattern-recognition', 'research']
  },
  {
    name: 'Katniss E.',
    experience_years: 5,
    availability: 'Immediate',
    traits: ['resilient', 'decisive'],
    quirk: 'Excellent under pressure, terrible with public speaking.',
    skills: ['precision', 'strategy', 'crisis-management']
  },
  {
    name: 'Michael S.',
    experience_years: 11,
    availability: 'Not looking',
    traits: ['enthusiastic', 'chaotic'],
    quirk: "World's best boss, according to a mug he bought himself.",
    skills: ['sales', 'public-speaking', 'team-building']
  },
  {
    name: 'Olivia P.',
    experience_years: 13,
    availability: '2 weeks',
    traits: ['decisive', 'intense'],
    quirk: 'Handles it. Whatever it is.',
    skills: ['crisis-management', 'negotiation', 'strategy', 'leadership']
  },
  {
    name: 'Ted L.',
    experience_years: 7,
    availability: 'Immediate',
    traits: ['empathetic', 'persistent'],
    quirk: 'Turns every technical setback into a folksy metaphor.',
    skills: ['team-building', 'optimism', 'mentorship', 'public-speaking']
  },
  {
    name: 'Miranda P.',
    experience_years: 18,
    availability: 'Not looking',
    traits: ['demanding', 'decisive'],
    quirk: 'Reviews every PR personally. Says nothing. Everyone panics.',
    skills: ['leadership', 'negotiation', 'stakeholder-management', 'precision']
  },
  {
    name: 'Dwight S.',
    experience_years: 9,
    availability: 'Immediate',
    traits: ['intense', 'loyal'],
    quirk: 'Assistant to the regional backend engineer.',
    skills: ['sales', 'negotiation', 'security', 'loyalty']
  }
];

const jobsData = [
  {
    title: 'Backend Detective',
    min_experience: 3,
    culture_keywords: ['analytical', 'autonomous'],
    tagline: 'We have a bug. We have no leads. We have you.',
    required_skills: ['deduction', 'pattern-recognition', 'forensics']
  },
  {
    title: 'Rapid Prototyping Engineer',
    min_experience: 2,
    culture_keywords: ['innovative', 'fast-paced'],
    tagline: 'Ship first, document never (kidding — please document).',
    required_skills: ['rapid-prototyping', 'systems-design']
  },
  {
    title: 'Developer Relations Lead',
    min_experience: 2,
    culture_keywords: ['energetic', 'curious'],
    tagline: 'Explain complex things to confused humans, cheerfully.',
    required_skills: ['public-speaking', 'research']
  },
  {
    title: 'Engineering Manager, Chaos Team',
    min_experience: 5,
    culture_keywords: ['empathetic', 'organized'],
    tagline: 'Herd cats. The cats are senior engineers.',
    required_skills: ['team-building', 'stakeholder-management', 'leadership']
  },
  {
    title: 'Incident Commander',
    min_experience: 4,
    culture_keywords: ['decisive', 'calm-under-pressure'],
    tagline: "3am page. You're the one who picks up.",
    required_skills: ['crisis-management', 'strategy', 'negotiation']
  },
  {
    title: 'Sales Engineer',
    min_experience: 3,
    culture_keywords: ['enthusiastic', 'persistent'],
    tagline: 'Sell the vision, then go build it.',
    required_skills: ['sales', 'public-speaking', 'negotiation']
  }
];

async function seedDatabase() {
  await testConnection();
  const connection = await pool.getConnection();

  try {
    // 1. Create tables if not present
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const cleanSql = schemaSql.replace(/--.*$/gm, '');
    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }

    // 2. Clear existing records safely to make script idempotent and rerunnable
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE candidate_skills');
    await connection.query('TRUNCATE TABLE job_required_skills');
    await connection.query('TRUNCATE TABLE candidates');
    await connection.query('TRUNCATE TABLE jobs');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    await connection.beginTransaction();

    // 3. Seed Candidates
    let candidateSkillsCount = 0;
    for (const candidate of candidatesData) {
      const [result] = await connection.query(
        'INSERT INTO candidates (name, experience_years, availability, traits, quirk) VALUES (?, ?, ?, ?, ?)',
        [
          candidate.name,
          candidate.experience_years,
          candidate.availability,
          JSON.stringify(candidate.traits),
          candidate.quirk
        ]
      );
      const candidateId = result.insertId;

      for (const skill of candidate.skills) {
        await connection.query(
          'INSERT INTO candidate_skills (candidate_id, skill) VALUES (?, ?)',
          [candidateId, skill]
        );
        candidateSkillsCount++;
      }
    }

    // 4. Seed Jobs
    let jobSkillsCount = 0;
    for (const job of jobsData) {
      const [result] = await connection.query(
        'INSERT INTO jobs (title, min_experience, culture_keywords, tagline) VALUES (?, ?, ?, ?)',
        [
          job.title,
          job.min_experience,
          JSON.stringify(job.culture_keywords),
          job.tagline
        ]
      );
      const jobId = result.insertId;

      for (const skill of job.required_skills) {
        await connection.query(
          'INSERT INTO job_required_skills (job_id, skill) VALUES (?, ?)',
          [jobId, skill]
        );
        jobSkillsCount++;
      }
    }

    await connection.commit();
    console.log('Database seeded successfully:');
    console.log(`- ${candidatesData.length} candidates inserted`);
    console.log(`- ${candidateSkillsCount} candidate skill rows inserted`);
    console.log(`- ${jobsData.length} jobs inserted`);
    console.log(`- ${jobSkillsCount} job required skill rows inserted`);
  } catch (err) {
    await connection.rollback();
    console.error('Error seeding database:', err.message);
    throw err;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed. Closing pool.');
      return pool.end();
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  candidatesData,
  jobsData
};
