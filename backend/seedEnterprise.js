require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");

const connectDB = require("./config/db");
const Campus = require("./models/campuses.model");
const Department = require("./models/departments.model");
const Student = require("./models/students.model");
const Issue = require("./models/issues.model");
const Admin = require("./models/admins.model");

const CAMPUSES = [
  "Islamabad Campus",
  "Lahore Campus",
  "Karachi Campus",
  "Peshawar Campus",
  "Quetta Campus",
  "Multan Campus"
];

const DEPARTMENTS_PER_CAMPUS = 20;
const TOTAL_STUDENTS = 50000;
const TOTAL_ISSUES = 70000;

const pakFirstNames = [
  "Ali","Ahmed","Hassan","Usman","Bilal","Hamza",
  "Zain","Saad","Abdullah","Umar",
  "Ayesha","Fatima","Zara","Hira","Maryam","Sana","Noor","Iqra"
];

const pakLastNames = [
  "Khan","Ahmed","Malik","Chaudhry","Butt",
  "Raza","Sheikh","Qureshi","Siddiqui","Farooq"
];

const issueCategories = [
  { primary: "electricity", subs: ["fan","switch","generator","wiring"] },
  { primary: "internet", subs: ["wifi","portal","ethernet"] },
  { primary: "hostel_issue", subs: ["water","room","cleaning"] },
  { primary: "campus_facility", subs: ["projector","ac","furniture"] },
  { primary: "faculty_issue", subs: ["grading","attendance","behavior"] }
];

const generateStudentEmail = (i) => {
  const year = 20 + (i % 5);
  const section = ["a","b","c","d"][i % 4];
  const roll = (100 + i).toString().padStart(3, "0");
  return `bscs${year}${section}${roll}@namal.edu.pk`;
};

const seedEnterprise = async () => {
  try {
    await connectDB();

    console.log("⚠ Clearing old data...");
    await Issue.deleteMany();
    await Student.deleteMany();
    await Department.deleteMany();
    await Campus.deleteMany();
    await Admin.deleteMany();

    console.log("✅ Creating campuses...");
    const campuses = [];

    for (let name of CAMPUSES) {
      const campus = await Campus.create({
        name,
        location: name.split(" ")[0]
      });
      campuses.push(campus);
    }

    console.log("✅ Creating departments...");
    const departments = [];

    for (let c = 0; c < campuses.length; c++) {
      const campus = campuses[c];

      for (let i = 0; i < DEPARTMENTS_PER_CAMPUS; i++) {
        const dept = await Department.create({
          name: `Department_${c}_${i}`,
          type: "academic",
          email: `dept${c}_${i}@namal.edu.pk`,  // ✅ UNIQUE
          office_location: `Block ${i}`,
          campus_id: campus._id
        });

        departments.push(dept);
      }
    }

    console.log("✅ Creating admins...");
    const adminPassword = await bcrypt.hash("admin123", 10);

    for (let dept of departments) {
      await Admin.create({
        name: `Admin_${dept.name}`,
        email: `admin.${dept.name.toLowerCase()}@namal.edu.pk`,
        password_hash: adminPassword,
        role: "department_admin",
        campus_id: dept.campus_id,
        department_id: dept._id,
        status: "active"
      });
    }

    await Admin.create({
      name: "Management Admin",
      email: "management@namal.edu.pk",
      password_hash: adminPassword,
      role: "management",
      campus_id: campuses[0]._id,
      department_id: null,
      status: "active"
    });

    await Admin.create({
      name: "Super Admin",
      email: "superadmin@namal.edu.pk",
      password_hash: adminPassword,
      role: "super_admin",
      campus_id: campuses[0]._id,
      department_id: null,
      status: "active"
    });

    console.log("✅ Creating students...");
    const students = [];
    const studentPassword = await bcrypt.hash("student123", 10);

    for (let i = 0; i < TOTAL_STUDENTS; i++) {
      const campus = campuses[i % campuses.length];

      const campusDepartments = departments.filter(
        d => d.campus_id.toString() === campus._id.toString()
      );

      const department = campusDepartments[i % campusDepartments.length];

      const fullName =
        pakFirstNames[i % pakFirstNames.length] +
        " " +
        pakLastNames[i % pakLastNames.length];

      const student = await Student.create({
        student_id: `STD${i}`,
        name: fullName,
        email: generateStudentEmail(i),
        password_hash: studentPassword,
        campus_id: campus._id,
        department_id: department._id,
        semester: (i % 8) + 1,
        contact_no: "03000000000",
        status: "active",
        is_email_verified: true
      });

      students.push(student);

      if (i % 5000 === 0) {
        console.log(`Inserted ${i} students`);
      }
    }

    console.log("✅ Creating issues...");
    for (let i = 0; i < TOTAL_ISSUES; i++) {
      const student = students[i % students.length];
      const category = issueCategories[i % issueCategories.length];
      const subcategory = category.subs[i % category.subs.length];

      await Issue.create({
        title: faker.lorem.words(4),
        description: faker.lorem.sentence(),
        primary_category: category.primary,
        subcategory,
        priority: ["low","medium","high"][i % 3],
        campus_id: student.campus_id,
        student_id: student._id,
        department_id: student.department_id,
        status: "submitted"
      });

      if (i % 10000 === 0) {
        console.log(`Inserted ${i} issues`);
      }
    }

    console.log("🎯 Enterprise Pakistani Dataset Created Successfully!");
    process.exit();

  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
};

seedEnterprise();