import { randomBytes, scryptSync } from "crypto";
import { storage } from "./storage";
import { createUser } from "./users";

type UniversitySeed = {
  name: string;
  shortName: string;
  description: string;
};

type CourseSeed = {
  uni: string;
  code: string;
  name: string;
  description: string;
};

function hashPassword(password: string, salt?: string) {
  const safeSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, safeSalt, 64).toString("hex");
  return `${safeSalt}:${hash}`;
}

const southAfricanUniversities: UniversitySeed[] = [
  { name: "University of Cape Town", shortName: "UCT", description: "Traditional research university in Cape Town." },
  { name: "University of Fort Hare", shortName: "UFH", description: "Historic institution in the Eastern Cape." },
  { name: "University of the Free State", shortName: "UFS", description: "Comprehensive university in Bloemfontein." },
  { name: "University of KwaZulu-Natal", shortName: "UKZN", description: "Multi-campus university across KwaZulu-Natal." },
  { name: "University of Limpopo", shortName: "UL", description: "University serving the Limpopo province." },
  { name: "North-West University", shortName: "NWU", description: "Comprehensive university with campuses across North West." },
  { name: "University of Pretoria", shortName: "UP", description: "Research university in Gauteng." },
  { name: "Rhodes University", shortName: "RU", description: "Residential university in Makhanda." },
  { name: "Stellenbosch University", shortName: "SU", description: "Research university in the Western Cape." },
  { name: "University of the Western Cape", shortName: "UWC", description: "Public university in Bellville, Cape Town." },
  { name: "University of the Witwatersrand", shortName: "WITS", description: "Research-intensive university in Johannesburg." },
  { name: "Sefako Makgatho Health Sciences University", shortName: "SMU", description: "Health sciences university in Pretoria North." },
  { name: "University of Johannesburg", shortName: "UJ", description: "Comprehensive university in Johannesburg." },
  { name: "University of South Africa", shortName: "UNISA", description: "Distance-learning university across South Africa." },
  { name: "Nelson Mandela University", shortName: "NMU", description: "Comprehensive university in Gqeberha." },
  { name: "University of Zululand", shortName: "UNIZULU", description: "Comprehensive university in KwaDlangezwa and Richards Bay." },
  { name: "Walter Sisulu University", shortName: "WSU", description: "Comprehensive university serving the Eastern Cape." },
  { name: "University of Venda", shortName: "UNIVEN", description: "Comprehensive rural-based university in Thohoyandou." },
  { name: "University of Mpumalanga", shortName: "UMP", description: "Emerging university in Mbombela and Siyabuswa." },
  { name: "Sol Plaatje University", shortName: "SPU", description: "University in Kimberley, Northern Cape." },
  { name: "Cape Peninsula University of Technology", shortName: "CPUT", description: "University of Technology in the Western Cape." },
  { name: "Central University of Technology", shortName: "CUT", description: "University of Technology in the Free State." },
  { name: "Durban University of Technology", shortName: "DUT", description: "University of Technology in Durban and Pietermaritzburg." },
  { name: "Tshwane University of Technology", shortName: "TUT", description: "University of Technology with multiple campuses in Gauteng." },
  { name: "Vaal University of Technology", shortName: "VUT", description: "University of Technology in Vanderbijlpark." },
  { name: "Mangosuthu University of Technology", shortName: "MUT", description: "University of Technology in Umlazi, Durban." },
];

const courseSeeds: CourseSeed[] = [
  { uni: "UCT", code: "CSC1010F", name: "Introduction to Computer Science", description: "Foundations of programming and problem solving." },
  { uni: "UCT", code: "MAM1000W", name: "Calculus & Linear Algebra", description: "Core mathematics for first-year science students." },
  { uni: "WITS", code: "COMS2004", name: "Data Structures & Algorithms", description: "Practical algorithms with Java examples." },
  { uni: "WITS", code: "ELEN3000", name: "Signals & Systems", description: "Continuous and discrete signal analysis." },
  { uni: "SU", code: "COS151", name: "Programming (Python)", description: "Introduction to programming for engineering students." },
  { uni: "SU", code: "MAT141", name: "Applied Mathematics I", description: "Mathematical techniques for physical sciences." },
  { uni: "UP", code: "COS132", name: "Imperative Programming", description: "Software development with an imperative paradigm." },
  { uni: "UP", code: "WTW158", name: "Calculus", description: "Single-variable calculus with applications." },
  { uni: "UJ", code: "ITRW121", name: "Introduction to Web Development", description: "Client-side and server-side web fundamentals." },
  { uni: "UJ", code: "COS111", name: "Computer Systems", description: "Basics of computer organization." },
  { uni: "UNISA", code: "INF1505", name: "Introduction to Programming", description: "Fundamentals of programming for distance learners." },
  { uni: "UNISA", code: "DBN111", name: "Database Design", description: "Relational database principles and SQL." },
  { uni: "NWU", code: "CMPT111", name: "Computer Programming", description: "Structured programming with practical labs." },
  { uni: "UKZN", code: "CSIS101", name: "Introduction to Information Systems", description: "Systems thinking and basic development." },
  { uni: "UWC", code: "CSC111", name: "Computer Science 1", description: "Programming logic and problem solving." },
  { uni: "NMU", code: "WRCS101", name: "Web & Client-Side Scripting", description: "Front-end web development essentials." },
  { uni: "WSU", code: "ICT101", name: "ICT Fundamentals", description: "Digital literacy and introductory programming." },
  { uni: "UNIZULU", code: "CSC121", name: "Structured Programming", description: "Structured programming with C/C++." },
  { uni: "UL", code: "CSM101", name: "Computer Skills & Methods", description: "Foundational digital skills and methods." },
  { uni: "UFH", code: "CS101", name: "Computer Science Basics", description: "Programming fundamentals for first years." },
  { uni: "UFS", code: "CSOV1514", name: "Computer Systems", description: "Computer systems and programming overview." },
  { uni: "SMU", code: "HSC101", name: "Health Sciences Computing", description: "Digital skills tailored for health sciences." },
  { uni: "UMP", code: "ICT111", name: "Information Systems 1", description: "Introductory IS concepts and programming." },
  { uni: "SPU", code: "ICT102", name: "Programming Fundamentals", description: "Programming logic for first-year students." },
  { uni: "CPUT", code: "ICT151S", name: "Information Systems I", description: "IS principles with practical labs." },
  { uni: "CUT", code: "ICTY101", name: "Information Technology Skills", description: "Foundational IT skills and problem solving." },
  { uni: "DUT", code: "ITJN101", name: "Introduction to Java", description: "Java programming basics for technologists." },
  { uni: "TUT", code: "COS101", name: "Computing Fundamentals", description: "Computing concepts and introductory coding." },
  { uni: "VUT", code: "ITE115", name: "Information Technology Essentials", description: "IT essentials with practical sessions." },
  { uni: "MUT", code: "ICS100", name: "Information & Computing Skills", description: "Foundational computing for first-year students." },
];

async function seed() {
  console.log("Seeding database...");

  const existingUniversities = await storage.getUniversities();
  if (existingUniversities.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  const universityMap = new Map<string, { id: number }>();

  for (const uni of southAfricanUniversities) {
    const created = await storage.createUniversity({
      name: uni.name,
      shortName: uni.shortName,
      description: uni.description,
      logoUrl: null,
    });
    universityMap.set(uni.shortName, created);
  }

  console.log(`Seeded ${universityMap.size} South African universities.`);

  const courseMap = new Map<string, { id: number }>();
  for (const course of courseSeeds) {
    const uni = universityMap.get(course.uni);
    if (!uni) continue;
    const created = await storage.createCourse({
      universityId: uni.id,
      code: course.code,
      name: course.name,
      description: course.description,
    });
    courseMap.set(`${course.uni}-${course.code}`, created);
  }

  console.log(`Seeded ${courseMap.size} courses.`);

  const demoUser = await createUser({
    email: "demo@studyoverflow.africa",
    firstName: "Demo",
    lastName: "Student",
    passwordHash: hashPassword("DemoPass123"),
  });

  const demoPosts = [
    {
      courseKey: "UCT-CSC1010F",
      title: "Tips for mastering recursion in CSC1010F",
      content: "I'm working through the recursion module and struggling to reason about the base case vs. the recursive step. What helped you internalize recursion in this course?",
    },
    {
      courseKey: "WITS-COMS2004",
      title: "Data structures exam prep",
      content: "Which topics carry the most weight in COMS2004? I'm reviewing hash tables, trees, and graphs. Any recommended past papers or patterns to focus on?",
    },
    {
      courseKey: "UP-COS132",
      title: "Setting up a reliable dev environment for COS132",
      content: "What IDE and tooling setup works best for the COS132 projects? Looking for advice on linters, formatters, and debugging tips that play nicely with the course starter kits.",
    },
  ];

  for (const post of demoPosts) {
    const course = courseMap.get(post.courseKey);
    if (!course) continue;
    const createdPost = await storage.createPost({
      courseId: course.id,
      authorId: demoUser.id,
      title: post.title,
      content: post.content,
    });
    await storage.createComment({
      postId: createdPost.id,
      authorId: demoUser.id,
      content: "Sharing a starter tip: draw the call stack on paper and label the base case clearly. It helps a lot!",
      parentId: null,
    });
  }

  console.log("Courses and demo posts seeded successfully!");
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
