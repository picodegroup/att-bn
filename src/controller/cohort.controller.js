import Cohort from "../models/cohort.js";
import User from "../models/user.js";

export const createCohort = async (req, res) => {
  try {
    const { name, description, category, studentIds } = req.body;

    const cohortExists = await Cohort.findOne({ name });
    if (cohortExists) {
      return res
        .status(400)
        .json({ message: "Cohort with this name already exists" });
    }

    if (studentIds && studentIds.length > 0) {
      const students = await User.find({
        _id: { $in: studentIds },
        isStudent: true,
      });

      if (students.length !== studentIds.length) {
        return res
          .status(400)
          .json({ message: "One or more student IDs are invalid" });
      }
    }

    const cohort = new Cohort({
      name,
      description,
      category,
      students: studentIds || [],
      createdBy: req.user._id,
    });

    const createdCohort = await cohort.save();
    res.status(201).json(createdCohort);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCohorts = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};

    const categoryFilter = req.query.category
      ? { category: req.query.category }
      : {};

    const activeFilter =
      req.query.active !== undefined
        ? { active: req.query.active === "true" }
        : {};
    const filter = { ...keyword, ...categoryFilter, ...activeFilter };

    const count = await Cohort.countDocuments(filter);

    const cohorts = await Cohort.find(filter)
      .populate("createdBy", "name telephone email")
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      cohorts,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCohortById = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id)
      .populate("students", "name telephone email paymentStatus")
      .populate("createdBy", "name email");

    if (cohort) {
      res.json(cohort);
    } else {
      res.status(404).json({ message: "Cohort not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addStudentsToCohort = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) {
      return res.status(404).json({ message: "Cohort not found" });
    }

    // Find the students to check if they exist
    const students = await User.find({
      _id: { $in: studentIds },
      isStudent: true,
    });

    if (students.length !== studentIds.length) {
      return res
        .status(400)
        .json({ message: "One or more student IDs are invalid" });
    }

    // Check if any students are already in other cohorts
    const cohorts = await Cohort.find({
      students: { $in: studentIds },
      _id: { $ne: req.params.id }, // Exclude the current cohort
    });

    if (cohorts.length > 0) {
      // Create a map of student IDs to cohort names
      const studentCohortMap = {};
      cohorts.forEach((cohort) => {
        cohort.students.forEach((studentId) => {
          const studentIdStr = studentId.toString();
          if (studentIds.includes(studentIdStr)) {
            studentCohortMap[studentIdStr] =
              cohort.name || cohort._id.toString();
          }
        });
      });

      return res.status(400).json({
        message: "Some students are already in other cohorts",
        studentsInCohorts: studentCohortMap,
      });
    }

    // If we get here, none of the students are in other cohorts
    const updatedStudentIds = [
      ...new Set([
        ...cohort.students.map((id) => id.toString()),
        ...studentIds,
      ]),
    ];

    cohort.students = updatedStudentIds;
    const updatedCohort = await cohort.save();
    res.json(updatedCohort);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeStudentsFromCohort = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const cohort = await Cohort.findById(req.params.id);

    if (!cohort) {
      return res.status(404).json({ message: "Cohort not found" });
    }
    cohort.students = cohort.students.filter(
      (studentId) => !studentIds.includes(studentId.toString())
    );

    const updatedCohort = await cohort.save();
    res.json(updatedCohort);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCohort = async (req, res) => {
  try {
    const { name, description, category, active } = req.body;
    const cohort = await Cohort.findById(req.params.id);

    if (cohort) {
      cohort.name = name || cohort.name;
      cohort.description = description || cohort.description;
      cohort.category = category || cohort.category;
      cohort.active = active !== undefined ? active : cohort.active;

      const updatedCohort = await cohort.save();
      res.json(updatedCohort);
    } else {
      res.status(404).json({ message: "Cohort not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
