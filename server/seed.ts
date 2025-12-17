import { db } from "./db";
import { universities, courses } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Check if data already exists
  const existingUniversities = await db.select().from(universities);
  if (existingUniversities.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // Insert universities
  const [mit, stanford, berkeley, cmu] = await db.insert(universities).values([
    {
      name: "Massachusetts Institute of Technology",
      shortName: "MIT",
      description: "A world-renowned research university in Cambridge, Massachusetts.",
    },
    {
      name: "Stanford University",
      shortName: "Stanford",
      description: "A private research university in Stanford, California.",
    },
    {
      name: "University of California, Berkeley",
      shortName: "UC Berkeley",
      description: "A public land-grant research university in Berkeley, California.",
    },
    {
      name: "Carnegie Mellon University",
      shortName: "CMU",
      description: "A private research university in Pittsburgh, Pennsylvania.",
    },
  ]).returning();

  console.log("Universities seeded:", mit.shortName, stanford.shortName, berkeley.shortName, cmu.shortName);

  // Insert courses
  await db.insert(courses).values([
    // MIT courses
    { universityId: mit.id, code: "6.006", name: "Introduction to Algorithms", description: "Design and analysis of algorithms." },
    { universityId: mit.id, code: "6.042", name: "Mathematics for Computer Science", description: "Discrete mathematics for CS." },
    { universityId: mit.id, code: "6.046", name: "Design and Analysis of Algorithms", description: "Advanced algorithms course." },
    { universityId: mit.id, code: "18.01", name: "Single Variable Calculus", description: "Calculus with one variable." },
    { universityId: mit.id, code: "18.02", name: "Multivariable Calculus", description: "Calculus with multiple variables." },
    
    // Stanford courses
    { universityId: stanford.id, code: "CS106A", name: "Programming Methodology", description: "Introduction to programming." },
    { universityId: stanford.id, code: "CS106B", name: "Programming Abstractions", description: "Data structures and algorithms." },
    { universityId: stanford.id, code: "CS107", name: "Computer Organization and Systems", description: "Systems programming." },
    { universityId: stanford.id, code: "CS161", name: "Design and Analysis of Algorithms", description: "Algorithm design techniques." },
    { universityId: stanford.id, code: "MATH51", name: "Linear Algebra and Differential Calculus", description: "Multivariable calculus and linear algebra." },
    
    // UC Berkeley courses
    { universityId: berkeley.id, code: "CS61A", name: "Structure and Interpretation of Computer Programs", description: "Introduction to programming and CS." },
    { universityId: berkeley.id, code: "CS61B", name: "Data Structures", description: "Data structures and algorithms in Java." },
    { universityId: berkeley.id, code: "CS61C", name: "Great Ideas in Computer Architecture", description: "Computer architecture and systems." },
    { universityId: berkeley.id, code: "CS170", name: "Efficient Algorithms and Intractable Problems", description: "Algorithm analysis and complexity." },
    { universityId: berkeley.id, code: "MATH54", name: "Linear Algebra and Differential Equations", description: "Core mathematics for engineering." },
    
    // CMU courses
    { universityId: cmu.id, code: "15-122", name: "Principles of Imperative Computation", description: "Foundations of programming." },
    { universityId: cmu.id, code: "15-150", name: "Principles of Functional Programming", description: "Functional programming in SML." },
    { universityId: cmu.id, code: "15-213", name: "Introduction to Computer Systems", description: "Systems programming fundamentals." },
    { universityId: cmu.id, code: "15-251", name: "Great Ideas in Theoretical Computer Science", description: "Theoretical CS fundamentals." },
    { universityId: cmu.id, code: "21-127", name: "Concepts of Mathematics", description: "Discrete math and proofs." },
  ]);

  console.log("Courses seeded successfully!");
}

seed()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
