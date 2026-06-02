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
const Notification = require("./models/notifications.model");
const Feedback = require("./models/feedback.model");
const TokenBlacklist = require("./models/tokenBlacklist.model");

// ============================
// CONFIG
// ============================
const TOTAL_STUDENTS = 50000;
const TOTAL_ISSUES = 70000;

const CAMPUSES = [
  "Islamabad Campus",
  "Lahore Campus",
  "Karachi Campus",
  "Peshawar Campus",
  "Quetta Campus",
  "Multan Campus"
];

// ============================
// ACADEMIC DEPARTMENTS — these get program codes
// Students enroll in these, email prefix = code
// ============================
const ACADEMIC_DEPTS = [
  { code: "bscs", name: "Computer Science" },
  { code: "bsse", name: "Software Engineering" },
  { code: "bsai", name: "Artificial Intelligence" },
  { code: "bsds", name: "Data Science" },
  { code: "bsee", name: "Electrical Engineering" },
  { code: "bsce", name: "Civil Engineering" },
  { code: "bsme", name: "Mechanical Engineering" },
  { code: "bsba", name: "Business Administration" },
  { code: "bsma", name: "Mathematics" },
  { code: "bsph", name: "Physics" }
];

// ============================
// SUPPORT DEPARTMENTS — no code (students don't enroll here)
// ============================
const SUPPORT_DEPTS = [
  { name: "IT Support", type: "support" },
  { name: "Library Services", type: "support" },
  { name: "Hostel Management", type: "support" },
  { name: "Transport Services", type: "support" },
  { name: "Campus Maintenance", type: "support" }
];

// ============================
// ADMINISTRATIVE DEPARTMENTS
// ============================
const ADMIN_DEPTS = [
  { name: "Examination Cell", type: "administrative" },
  { name: "Finance Department", type: "administrative" },
  { name: "Admissions Office", type: "administrative" },
  { name: "Student Affairs", type: "administrative" },
  { name: "HR Department", type: "administrative" }
];

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

const STATUS_DIST = [
  "submitted","submitted","submitted",
  "under_review","under_review",
  "in_progress","in_progress","in_progress",
  "resolved","resolved","resolved","resolved",
  "closed","closed",
  "rejected"
];

const RESOLUTIONS = [
  "Issue fixed by maintenance team. Verified and confirmed working properly now.",
  "Hardware replaced and tested. Functioning normally for past 24 hours.",
  "Software patch applied. Service is back to normal operations now.",
  "Complaint forwarded and addressed. Team confirmed problem resolved.",
  "On-site inspection complete. Problem identified and repaired today.",
  "Root cause identified and corrected. Issue should not occur again."
];

const REJECTIONS = [
  "This issue belongs to a different department. Please resubmit correctly.",
  "Duplicate issue — already being handled under a separate ticket.",
  "After investigation this was found to be a user error, not system fault.",
  "Insufficient information provided. Please resubmit with more details."
];

// ============================
// EMAIL GENERATOR
// Email prefix matches student's actual department
// 10 codes × 5 years × 4 sections × 250 rolls = 50,000 unique
// ============================
const generateStudentEmail = (programCode, withinProgramIndex) => {
  // For each program code, we cycle through year/section/roll combinations
  // 5 years × 4 sections × 250 rolls = 5000 students per program code
  
  const year = 20 + (withinProgramIndex % 5);                          // 20-24
  const section = ["a","b","c","d"][Math.floor(withinProgramIndex / 5) % 4];   // a-d
  const roll = 100 + Math.floor(withinProgramIndex / 20);              // 100-349
  
  return `${programCode}${year}${section}${String(roll).padStart(3, "0")}@namal.edu.pk`;
};

// ============================
// MAIN SEED
// ============================
const seedEnterprise = async () => {
  const startTime = Date.now();
  
  try {
    await connectDB();

    console.log("\n🔥 ============================================");
    console.log("   DSIMS Enterprise Dataset Generator");
    console.log("============================================\n");

    // ============================
    // CLEAR
    // ============================
    console.log("⚠️  Clearing all old data...");
    await Promise.all([
      Issue.deleteMany({}),
      Student.deleteMany({}),
      Department.deleteMany({}),
      Campus.deleteMany({}),
      Admin.deleteMany({}),
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
      TokenBlacklist.deleteMany({})
    ]);
    console.log("✅ All collections cleared\n");

    // ============================
    // CAMPUSES
    // ============================
    console.log("🏛️  Creating campuses...");
    const campuses = [];
    for (let name of CAMPUSES) {
      const campus = await Campus.create({
        name,
        location: name.split(" ")[0]
      });
      campuses.push(campus);
    }
    console.log(`✅ ${campuses.length} campuses created\n`);

    // ============================
    // DEPARTMENTS (per campus)
    // ============================
    console.log("🏢 Creating departments...");
    const academicDepts = [];   // [{ _id, campus_id, code, name }]
    const allDepts = [];        // all departments (for admin creation)

    for (let c = 0; c < campuses.length; c++) {
      const campus = campuses[c];

      // Academic departments (with program codes)
      for (let i = 0; i < ACADEMIC_DEPTS.length; i++) {
        const a = ACADEMIC_DEPTS[i];
        const dept = await Department.create({
          name: a.name,
          type: "academic",
          email: `${a.code}.c${c}@namal.edu.pk`,
          office_location: `${campus.location} - Academic Block ${String.fromCharCode(65 + i)}`,
          campus_id: campus._id
        });
        academicDepts.push({
          _id: dept._id,
          campus_id: campus._id,
          code: a.code,
          name: a.name
        });
        allDepts.push(dept);
      }

      // Support departments
      for (let i = 0; i < SUPPORT_DEPTS.length; i++) {
        const s = SUPPORT_DEPTS[i];
        const dept = await Department.create({
          name: s.name,
          type: s.type,
          email: `${s.name.toLowerCase().replace(/\s+/g, ".")}.c${c}@namal.edu.pk`,
          office_location: `${campus.location} - Support Block`,
          campus_id: campus._id
        });
        allDepts.push(dept);
      }

      // Administrative departments
      for (let i = 0; i < ADMIN_DEPTS.length; i++) {
        const ad = ADMIN_DEPTS[i];
        const dept = await Department.create({
          name: ad.name,
          type: ad.type,
          email: `${ad.name.toLowerCase().replace(/\s+/g, ".")}.c${c}@namal.edu.pk`,
          office_location: `${campus.location} - Admin Block`,
          campus_id: campus._id
        });
        allDepts.push(dept);
      }
    }
    console.log(`✅ ${allDepts.length} departments created (${academicDepts.length} academic + ${SUPPORT_DEPTS.length * campuses.length} support + ${ADMIN_DEPTS.length * campuses.length} administrative)\n`);

    // ============================
    // ADMINS
    // ============================
    console.log("👔 Creating admins...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminByDept = {};

    for (let dept of allDepts) {
      const admin = await Admin.create({
        name: `Admin_${dept.name}`,
        email: `admin.${dept.name.toLowerCase().replace(/\s+/g, ".")}.${dept._id.toString().slice(-4)}@namal.edu.pk`,
        password_hash: adminPassword,
        role: "department_admin",
        campus_id: dept.campus_id,
        department_id: dept._id,
        status: "active"
      });
      adminByDept[dept._id.toString()] = admin._id;
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

    const superAdmin = await Admin.create({
      name: "Super Admin",
      email: "superadmin@namal.edu.pk",
      password_hash: adminPassword,
      role: "super_admin",
      campus_id: campuses[0]._id,
      department_id: null,
      status: "active"
    });
    console.log(`✅ ${allDepts.length + 2} admins created\n`);

    // ============================
    // STUDENTS — assigned to academic depts only
    // Email prefix MATCHES their department's program code
    // ============================
    console.log(`🎓 Creating ${TOTAL_STUDENTS} students...`);
    const studentRefs = [];
    const studentPassword = await bcrypt.hash("student123", 10);

    // Group academic depts by program code
    // Each code has 6 depts (one per campus)
    const deptsByCode = {};
    for (const d of academicDepts) {
      if (!deptsByCode[d.code]) deptsByCode[d.code] = [];
      deptsByCode[d.code].push(d);
    }

    // Counters per program code (for email uniqueness)
    const programCounters = {};
    ACADEMIC_DEPTS.forEach(a => { programCounters[a.code] = 0; });

    for (let i = 0; i < TOTAL_STUDENTS; i++) {
      // Pick program code (round-robin across all 10 academic programs)
      const programCode = ACADEMIC_DEPTS[i % ACADEMIC_DEPTS.length].code;
      
      // Pick which campus's instance of this program
      const deptsForProgram = deptsByCode[programCode];
      const dept = deptsForProgram[Math.floor(i / ACADEMIC_DEPTS.length) % deptsForProgram.length];

      // Within-program index for unique email
      const withinProgramIndex = programCounters[programCode];
      programCounters[programCode]++;

      const fullName =
        pakFirstNames[i % pakFirstNames.length] +
        " " +
        pakLastNames[i % pakLastNames.length];

      try {
        const student = await Student.create({
          student_id: `STD${String(i).padStart(6, "0")}`,
          name: fullName,
          email: generateStudentEmail(programCode, withinProgramIndex),
          password_hash: studentPassword,
          campus_id: dept.campus_id,
          department_id: dept._id,
          semester: (i % 8) + 1,
          contact_no: "03000000000",
          status: "active",
          is_email_verified: true
        });

        studentRefs.push({
          _id: student._id,
          campus_id: student.campus_id,
          department_id: student.department_id
        });
      } catch (err) {
        console.error(`   ⚠️  Skip student ${i}: ${err.message}`);
      }

      if (i % 5000 === 0 && i > 0) {
        console.log(`   📊 ${i} / ${TOTAL_STUDENTS} students`);
      }
    }
    console.log(`✅ ${studentRefs.length} students created\n`);

    // ============================
    // ISSUES (full lifecycle)
    // Students submit to ANY department (academic, support, admin) — that's realistic
    // ============================
    console.log(`📝 Creating ${TOTAL_ISSUES} issues...`);
    const feedbackEligible = [];

    for (let i = 0; i < TOTAL_ISSUES; i++) {
      const student = studentRefs[i % studentRefs.length];
      if (!student) continue;

      const category = issueCategories[i % issueCategories.length];
      const subcategory = category.subs[i % category.subs.length];
      const status = STATUS_DIST[i % STATUS_DIST.length];

      // Students can submit issues to any department in their campus (realistic)
      // But for simplicity, route to their own department's admin
      const adminId = adminByDept[student.department_id.toString()];

      const createdAt = new Date(Date.now() - ((i * 60000) % (90 * 24 * 60 * 60 * 1000)));
      const updates = [{
        updated_by: student._id,
        updater_role: "student",
        message: "Issue submitted",
        old_status: null,
        new_status: "submitted",
        timestamp: createdAt
      }];

      let assigned_to_admin_id = null;
      let resolution_summary = null;
      let lastTs = createdAt;

      if (["under_review","in_progress","resolved","closed","rejected"].includes(status)) {
        assigned_to_admin_id = adminId;
        lastTs = new Date(lastTs.getTime() + 3600000);
        updates.push({
          updated_by: adminId,
          updater_role: "department_admin",
          message: "Issue assigned and moved to under_review",
          old_status: "submitted",
          new_status: "under_review",
          timestamp: lastTs
        });
      }

      if (["in_progress","resolved","closed"].includes(status)) {
        lastTs = new Date(lastTs.getTime() + 3600000 * 12);
        updates.push({
          updated_by: adminId,
          updater_role: "department_admin",
          message: "Working on this issue. Team notified.",
          old_status: "under_review",
          new_status: "in_progress",
          timestamp: lastTs
        });
      }

      if (["resolved","closed"].includes(status)) {
        resolution_summary = RESOLUTIONS[i % RESOLUTIONS.length];
        lastTs = new Date(lastTs.getTime() + 3600000 * 24);
        updates.push({
          updated_by: adminId,
          updater_role: "department_admin",
          message: resolution_summary,
          old_status: "in_progress",
          new_status: "resolved",
          timestamp: lastTs
        });
      }

      if (status === "closed") {
        lastTs = new Date(lastTs.getTime() + 3600000 * 12);
        updates.push({
          updated_by: adminId,
          updater_role: "department_admin",
          message: "Confirmed resolved. Closing ticket.",
          old_status: "resolved",
          new_status: "closed",
          timestamp: lastTs
        });
      }

      if (status === "rejected") {
        const rej = REJECTIONS[i % REJECTIONS.length];
        lastTs = new Date(lastTs.getTime() + 3600000 * 6);
        updates.push({
          updated_by: adminId,
          updater_role: "department_admin",
          message: rej,
          old_status: "under_review",
          new_status: "rejected",
          timestamp: lastTs
        });
      }

      try {
        const issue = await Issue.create({
          title: faker.lorem.words(4),
          description: faker.lorem.sentence(),
          primary_category: category.primary,
          subcategory,
          priority: ["low","medium","high","urgent"][i % 4],
          status,
          campus_id: student.campus_id,
          student_id: student._id,
          department_id: student.department_id,
          assigned_to_admin_id,
          is_anonymous: i % 10 === 0,
          resolution_summary,
          updates,
          createdAt,
          updatedAt: lastTs
        });

        if (["resolved","closed","rejected"].includes(status) && assigned_to_admin_id) {
          feedbackEligible.push({
            _id: issue._id,
            student_id: student._id,
            admin_id: assigned_to_admin_id,
            status,
            campus_id: student.campus_id,
            department_id: student.department_id,
            updatedAt: lastTs
          });
        }
      } catch (err) {
        console.error(`   ⚠️  Skip issue ${i}: ${err.message}`);
      }

      if (i % 5000 === 0 && i > 0) {
        console.log(`   📊 ${i} / ${TOTAL_ISSUES} issues`);
      }
    }
    console.log(`✅ ${TOTAL_ISSUES} issues created\n`);

    // ============================
    // FEEDBACK
    // ============================
    console.log(`⭐ Creating feedback...`);
    const targetFeedback = Math.floor(feedbackEligible.length * 0.6);
    let feedbackCount = 0;

    const POSITIVE = [
      "Great work! Issue was fixed quickly.",
      "Very satisfied with response time. Thank you!",
      "Excellent service from the maintenance team.",
      "Resolved within reasonable time. Appreciate the effort."
    ];
    const NEGATIVE = [
      "Issue marked resolved but problem persists. Disappointing.",
      "Admin did not actually fix anything. Just closed ticket.",
      "No communication from admin throughout the process.",
      "Quick fix that didn't last. Problem came back next day."
    ];

    for (let i = 0; i < targetFeedback; i++) {
      const ref = feedbackEligible[i];
      const roll = i % 10;
      const rating = roll < 1 ? 1 : roll < 2 ? 2 : roll < 4 ? 3 : roll < 7 ? 4 : 5;
      const was_actually_resolved = rating >= 3;
      const flag = rating <= 2 && i % 3 === 0;

      let comment = null;
      if (rating >= 4) comment = POSITIVE[i % POSITIVE.length];
      else if (rating <= 2) comment = NEGATIVE[i % NEGATIVE.length];

      if (flag && (!comment || comment.length < 30)) {
        comment = "This issue was not properly handled. Admin did not investigate the actual problem.";
      }

      const escalated = rating <= 2 || flag || (!was_actually_resolved && ref.status === "resolved");

      try {
        await Feedback.create({
          issue_id: ref._id,
          student_id: ref.student_id,
          admin_id: ref.admin_id,
          issue_final_status: ref.status,
          rating,
          was_actually_resolved,
          comment,
          flag_for_review: flag,
          requires_super_admin_attention: escalated,
          super_admin_reviewed: escalated && i % 3 === 0,
          super_admin_reviewed_by: (escalated && i % 3 === 0) ? superAdmin._id : null,
          super_admin_notes: (escalated && i % 3 === 0)
            ? "Reviewed by super admin. Admin warned about quality."
            : null,
          campus_id: ref.campus_id,
          department_id: ref.department_id,
          createdAt: new Date(ref.updatedAt.getTime() + 3600000)
        });
        feedbackCount++;
      } catch (e) {
        // silently skip
      }

      if (i % 5000 === 0 && i > 0) {
        console.log(`   ⭐ ${feedbackCount} feedbacks created`);
      }
    }
    console.log(`✅ ${feedbackCount} feedbacks created\n`);

    // ============================
    // NOTIFICATIONS
    // ============================
    console.log(`🔔 Creating sample notifications...`);
    const sample = feedbackEligible.slice(-1000);
    let notifCount = 0;
    for (let i = 0; i < sample.length; i++) {
      try {
        await Notification.create({
          recipient_id: sample[i].student_id,
          recipient_role: "student",
          issue_id: sample[i]._id,
          message: `Your issue status changed to ${sample[i].status}.`,
          is_read: i % 3 === 0
        });
        notifCount++;
      } catch (e) {}
    }
    console.log(`✅ ${notifCount} notifications created\n`);

    // ============================
    // SUMMARY
    // ============================
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log("🎯 ============================================");
    console.log("   DATASET GENERATION COMPLETE!");
    console.log("============================================\n");
    console.log(`   🏛️  Campuses:      ${campuses.length}`);
    console.log(`   🏢 Departments:   ${allDepts.length}`);
    console.log(`      ├─ Academic:    ${academicDepts.length}`);
    console.log(`      ├─ Support:     ${SUPPORT_DEPTS.length * campuses.length}`);
    console.log(`      └─ Admin:       ${ADMIN_DEPTS.length * campuses.length}`);
    console.log(`   👔 Admins:        ${allDepts.length + 2}`);
    console.log(`   🎓 Students:      ${studentRefs.length}`);
    console.log(`   📝 Issues:        ${TOTAL_ISSUES}`);
    console.log(`   ⭐ Feedbacks:     ${feedbackCount}`);
    console.log(`   🔔 Notifications: ${notifCount}`);
    console.log(`   ⏱️  Duration:      ${duration} minutes`);
    console.log("");
    console.log("🔑 Test Logins:");
    console.log("   Super Admin:  superadmin@namal.edu.pk / admin123");
    console.log("   Management:   management@namal.edu.pk / admin123");
    console.log("   Student CS:   bscs20a100@namal.edu.pk / student123");
    console.log("   Student SE:   bsse20a100@namal.edu.pk / student123");
    console.log("   Student AI:   bsai20a100@namal.edu.pk / student123");
    console.log("");
    console.log("📚 Available Program Codes:");
    ACADEMIC_DEPTS.forEach(a => {
      console.log(`   ${a.code} → ${a.name}`);
    });
    console.log("");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error during seeding:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedEnterprise();