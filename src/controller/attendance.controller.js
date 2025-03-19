import Attendance from "../models/attendance.js";
import User from "../models/user.js";
import Cohort from "../models/cohort.js";

export const getAttendances = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
      ? {
          note: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};
    const userFilter = req.query.userId ? { user: req.query.userId } : {};
    const filter = { ...keyword, ...userFilter };

    const count = await Attendance.countDocuments(filter);

    const attendances = await Attendance.find(filter)
      .populate("user", "name email role isStudent paymentStatus")
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ date: -1 });

    res.json({
      attendances,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate(
      "user",
      "name email role isStudent paymentStatus"
    );

    if (attendance) {
      res.json(attendance);
    } else {
      res.status(404).json({ message: "Attendance record not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAttendance = async (req, res) => {
  try {
    const { userId, date, status, note, lateArrivalTime } = req.body;

    const attendance = new Attendance({
      user: userId,
      date: new Date(date),
      status,
      note,
      lateArrivalTime: status === "late" ? lateArrivalTime : null,
    });

    const createdAttendance = await attendance.save();
    await updateUserAttendanceStats(userId);

    res.status(201).json(createdAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { date, status, note, lateArrivalTime } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (attendance) {
      const previousStatus = attendance.status;

      attendance.date = new Date(date) || attendance.date;
      attendance.status = status || attendance.status;
      attendance.note = note || attendance.note;
      attendance.lateArrivalTime =
        status === "late"
          ? lateArrivalTime || attendance.lateArrivalTime
          : null;

      const updatedAttendance = await attendance.save();
      if (previousStatus !== status) {
        await updateUserAttendanceStats(attendance.user);
      }

      res.json(updatedAttendance);
    } else {
      res.status(404).json({ message: "Attendance record not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (attendance) {
      const userId = attendance.user;
      await attendance.deleteOne();

      await updateUserAttendanceStats(userId);

      res.json({ message: "Attendance record removed" });
    } else {
      res.status(404).json({ message: "Attendance record not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserAttendanceStats = async (req, res) => {
  try {
    const userId = req.params.userId;

    const absences = await Attendance.countDocuments({
      user: userId,
      status: "absent",
    });

    const lateArrivals = await Attendance.countDocuments({
      user: userId,
      status: "late",
    });

    const lateDetails = await Attendance.find({
      user: userId,
      status: "late",
    })
      .select("date lateArrivalTime")
      .sort({ date: -1 });

    res.json({
      userId,
      totalAbsent: absences,
      totalLate: lateArrivals,
      lateDetails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserAttendanceStats = async (userId) => {
  try {
    const absences = await Attendance.countDocuments({
      user: userId,
      status: "absent",
    });

    const lateArrivals = await Attendance.countDocuments({
      user: userId,
      status: "late",
    });

    await User.findByIdAndUpdate(userId, {
      attendanceStats: {
        totalAbsent: absences,
        totalLate: lateArrivals,
      },
    });
  } catch (error) {
    console.error("Error updating user attendance stats:", error);
  }
};

export const createCohortAttendance = async (req, res) => {
  try {
    const { cohortId, date, attendanceRecords, defaultStatus } = req.body;

    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({ message: "Cohort not found" });
    }
    let createdRecords = [];
    let errors = [];
    if (attendanceRecords && attendanceRecords.length > 0) {
      for (const record of attendanceRecords) {
        try {
          const attendance = new Attendance({
            user: record.userId,
            cohort: cohortId,
            date: new Date(date),
            status: record.status,
            note: record.note || "",
            lateArrivalTime:
              record.status === "late" ? record.lateArrivalTime : null,
          });

          const savedAttendance = await attendance.save();
          await updateUserAttendanceStats(record.userId);
          createdRecords.push(savedAttendance);
        } catch (err) {
          errors.push({ userId: record.userId, error: err.message });
        }
      }
    } else if (defaultStatus) {
      for (const studentId of cohort.students) {
        try {
          const attendance = new Attendance({
            user: studentId,
            cohort: cohortId,
            date: new Date(date),
            status: defaultStatus,
            note: "",
          });

          const savedAttendance = await attendance.save();
          await updateUserAttendanceStats(studentId);
          createdRecords.push(savedAttendance);
        } catch (err) {
          errors.push({ userId: studentId, error: err.message });
        }
      }
    } else {
      return res.status(400).json({
        message: "Either attendanceRecords or defaultStatus must be provided",
      });
    }

    res.status(201).json({
      message: `Created ${createdRecords.length} attendance records`,
      createdRecords,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAttendancesByCohort = async (req, res) => {
  try {
    const cohortId = req.params.cohortId;
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const dateFilter = {};
    if (req.query.startDate) {
      dateFilter.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      dateFilter.$lte = new Date(req.query.endDate);
    }

    const dateCondition =
      Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    const statusFilter = req.query.status ? { status: req.query.status } : {};
    const filter = {
      cohort: cohortId,
      ...dateCondition,
      ...statusFilter,
    };

    const count = await Attendance.countDocuments(filter);

    const attendances = await Attendance.find(filter)
      .populate("user", "name email role isStudent paymentStatus")
      .populate("cohort", "name category")
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ date: -1 });

    res.json({
      attendances,
      page,
      pages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCohortAttendanceSummary = async (req, res) => {
  try {
    const cohortId = req.params.cohortId;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;

    // Date range condition
    const dateCondition = {};
    if (startDate) dateCondition.$gte = startDate;
    if (endDate) dateCondition.$lte = endDate;

    const cohort = await Cohort.findById(cohortId).populate("students", "name");
    if (!cohort) {
      return res.status(404).json({ message: "Cohort not found" });
    }

    const filter = {
      cohort: cohortId,
      ...(Object.keys(dateCondition).length > 0 ? { date: dateCondition } : {}),
    };

    const attendanceRecords = await Attendance.find(filter);

    const studentSummaries = {};
    cohort.students.forEach((student) => {
      studentSummaries[student._id] = {
        studentId: student._id,
        name: student.name,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendanceRate: 0,
        records: [],
      };
    });

    attendanceRecords.forEach((record) => {
      const studentId = record.user.toString();
      if (studentSummaries[studentId]) {
        studentSummaries[studentId][record.status]++;
        studentSummaries[studentId].records.push({
          date: record.date,
          status: record.status,
          note: record.note,
        });
      }
    });

    Object.values(studentSummaries).forEach((summary) => {
      const total =
        summary.present + summary.absent + summary.late + summary.excused;
      summary.attendanceRate =
        total > 0
          ? (((summary.present + summary.excused) / total) * 100).toFixed(2)
          : 0;
    });

    const attendanceDates = [
      ...new Set(
        attendanceRecords.map(
          (record) => record.date.toISOString().split("T")[0]
        )
      ),
    ].sort();

    res.json({
      cohort: {
        id: cohort._id,
        name: cohort.name,
        category: cohort.category,
        studentCount: cohort.students.length,
      },
      attendanceDates,
      studentSummaries: Object.values(studentSummaries),
      dateRange: {
        start: startDate || "all time",
        end: endDate || "present",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

