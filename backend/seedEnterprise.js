require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");

const connectDB = require("./config/db");
const Campus = require("./models/campuses.model");
const Department = require("./models/departments.model");
const Student = require("./models/students.model");
const Issue = require("./models/issues.model");

const CAMPUSES_COUNT = 4;
const DEPARTMENTS_PER_CAMPUS = 20;
const TOTAL_STUDENTS = 50000;
const TOTAL_ISSUES = 100000;

const generateStudentEmail = (i, campusIndex) => {
  const year = 20 + (i % 5);
  const section = ["a", "b", "c", "d"][i % 4];
  const roll = (100 + i).toString().padStart(3, "0");
  return `bscs${year}${section}${roll}@namal.edu.pk`;
};

const seedEnterpriseData = async () => {
  try {
    await connectDB();

    console.log("⚠ Clearing old data...");
    await Issue.deleteMany();
    await Student.deleteMany();
    await Department.deleteMany();
    await Campus.deleteMany();

    console.log("✅ Creating campuses...");
    const campuses = [];

    for (let i = 0; i < CAMPUSES_COUNT; i++) {
      const campus = await Campus.create({
        name: `Campus_${i + 1}`,
        location: faker.location.city()
      });
      campuses.push(campus);
    }

    console.log("✅ Creating departments...");
    const departments = [];

    for (let c = 0; c < CAMPUSES_COUNT; c++) {
      for (let d = 0; d < DEPARTMENTS_PER_CAMPUS; d++) {
        const dept = await Department.create({
          name: `Dept_${c}_${d}`,
          type: "academic",
          email: `dept${c}_${d}@namal.edu.pk`,
          office_location: `Block ${d}`,
          campus_id: campuses[c]._id
        });
        departments.push(dept);
      }
    }

    console.log("✅ Creating 50,000 students distributed across campuses...");
    const students = [];
    const hashedPassword = await bcrypt.hash("student123", 10);

    for (let i = 0; i < TOTAL_STUDENTS; i++) {
      const campusIndex = i % CAMPUSES_COUNT;
      const campus = campuses[campusIndex];

      const campusDepartments = departments.filter(
        (d) => d.campus_id.toString() === campus._id.toString()
      );

      const department =
        campusDepartments[i % campusDepartments.length];

      const student = await Student.create({
        student_id: `STD${i}`,
        name: faker.person.fullName(),
        email: generateStudentEmail(i, campusIndex),
        password_hash: hashedPassword,
        campus_id: campus._id,
        department_id: department._id,
        semester: faker.number.int({ min: 1, max: 8 }),
        contact_no: "03000000000",
        status: "active",
        is_email_verified: true
      });

      students.push(student);

      if (i % 5000 === 0) {
        console.log(`Inserted ${i} students`);
      }
    }

    console.log("✅ Creating 100,000 issues distributed across campuses...");
    for (let i = 0; i < TOTAL_ISSUES; i++) {
      const student = students[i % students.length];

      await Issue.create({
        title: faker.lorem.words(4),
        description: faker.lorem.sentence(),
        category: "facility",
        priority: ["low", "medium", "high"][i % 3],
        campus_id: student.campus_id,
        student_id: student._id,
        department_id: student.department_id,
        status: "submitted"
      });

      if (i % 10000 === 0) {
        console.log(`Inserted ${i} issues`);
      }
    }

    console.log("🎯 Enterprise multi-campus dataset created successfully.");
    process.exit();

  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
};

seedEnterpriseData();