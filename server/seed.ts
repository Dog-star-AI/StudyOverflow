import { storage } from "./storage";

async function seed() {
  console.log("Seeding database...");

  const existingUniversities = await storage.getUniversities();
  if (existingUniversities.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  const mit = await storage.createUniversity({
    name: "Massachusetts Institute of Technology",
    shortName: "MIT",
    description: "A world-renowned research university in Cambridge, Massachusetts.",
    logoUrl: null,
  });
  const stanford = await storage.createUniversity({
    name: "Stanford University",
    shortName: "Stanford",
    description: "A private research university in Stanford, California.",
    logoUrl: null,
  });
  const berkeley = await storage.createUniversity({
    name: "University of California, Berkeley",
    shortName: "UC Berkeley",
    description: "A public land-grant research university in Berkeley, California.",
    logoUrl: null,
  });
  const cmu = await storage.createUniversity({
    name: "Carnegie Mellon University",
    shortName: "CMU",
    description: "A private research university in Pittsburgh, Pennsylvania.",
    logoUrl: null,
  });

  console.log("Universities seeded:", mit.shortName, stanford.shortName, berkeley.shortName, cmu.shortName);

  await storage.createCourse({ universityId: mit.id, code: "6.006", name: "Introduction to Algorithms", description: "Design and analysis of algorithms." });
  await storage.createCourse({ universityId: mit.id, code: "6.042", name: "Mathematics for Computer Science", description: "Discrete mathematics for CS." });
  await storage.createCourse({ universityId: mit.id, code: "6.046", name: "Design and Analysis of Algorithms", description: "Advanced algorithms course." });
  await storage.createCourse({ universityId: mit.id, code: "18.01", name: "Single Variable Calculus", description: "Calculus with one variable." });
  await storage.createCourse({ universityId: mit.id, code: "18.02", name: "Multivariable Calculus", description: "Calculus with multiple variables." });

  await storage.createCourse({ universityId: stanford.id, code: "CS106A", name: "Programming Methodology", description: "Introduction to programming." });
  await storage.createCourse({ universityId: stanford.id, code: "CS106B", name: "Programming Abstractions", description: "Data structures and algorithms." });
  await storage.createCourse({ universityId: stanford.id, code: "CS107", name: "Computer Organization and Systems", description: "Systems programming." });
  await storage.createCourse({ universityId: stanford.id, code: "CS161", name: "Design and Analysis of Algorithms", description: "Algorithm design techniques." });
  await storage.createCourse({ universityId: stanford.id, code: "MATH51", name: "Linear Algebra and Differential Calculus", description: "Multivariable calculus and linear algebra." });

  await storage.createCourse({ universityId: berkeley.id, code: "CS61A", name: "Structure and Interpretation of Computer Programs", description: "Introduction to programming and CS." });
  await storage.createCourse({ universityId: berkeley.id, code: "CS61B", name: "Data Structures", description: "Data structures and algorithms in Java." });
  await storage.createCourse({ universityId: berkeley.id, code: "CS61C", name: "Great Ideas in Computer Architecture", description: "Computer architecture and systems." });
  await storage.createCourse({ universityId: berkeley.id, code: "CS170", name: "Efficient Algorithms and Intractable Problems", description: "Algorithm analysis and complexity." });
  await storage.createCourse({ universityId: berkeley.id, code: "MATH54", name: "Linear Algebra and Differential Equations", description: "Core mathematics for engineering." });

  await storage.createCourse({ universityId: cmu.id, code: "15-122", name: "Principles of Imperative Computation", description: "Foundations of programming." });
  await storage.createCourse({ universityId: cmu.id, code: "15-150", name: "Principles of Functional Programming", description: "Functional programming in SML." });
  await storage.createCourse({ universityId: cmu.id, code: "15-213", name: "Introduction to Computer Systems", description: "Systems programming fundamentals." });
  await storage.createCourse({ universityId: cmu.id, code: "15-251", name: "Great Ideas in Theoretical Computer Science", description: "Theoretical CS fundamentals." });
  await storage.createCourse({ universityId: cmu.id, code: "21-127", name: "Concepts of Mathematics", description: "Discrete math and proofs." });

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
