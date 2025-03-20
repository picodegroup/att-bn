
import School from "../models/school.js";


export const createSchool = async (req, res) => {
    try {
      const { name, location } = req.body;
  
      // Check if school with the same name already exists
      const schoolExists = await School.findOne({ name });
      if (schoolExists) {
        return res.status(400).json({ message: "School with this name already exists" });
      }
  
      const school = await School.create({
        name,
        location,
      });
  
      if (school) {
        res.status(201).json({
          _id: school._id,
          name: school.name,
          location: school.location,
          createdAt: school.createdAt,
        });
      } else {
        res.status(400).json({ message: "Invalid school data" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  export const getSchools = async (req, res) => {
    try {
      const schools = await School.find({}).sort({ createdAt: -1 });
      res.json(schools);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

  export const getSchoolById = async (req, res) => {
    try {
      const school = await School.findById(req.params.id);
      
      if (school) {
        res.json(school);
      } else {
        res.status(404).json({ message: "School not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

  export const updateSchool = async (req, res) => {
    try {
      const { name, location } = req.body;
      
      const school = await School.findById(req.params.id);
      
      if (school) {
        school.name = name || school.name;
        school.location = location || school.location;
        
        const updatedSchool = await school.save();
        
        res.json({
          _id: updatedSchool._id,
          name: updatedSchool.name,
          location: updatedSchool.location,
          createdAt: updatedSchool.createdAt,
        });
      } else {
        res.status(404).json({ message: "School not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

  export const deleteSchool = async (req, res) => {
    try {
      const school = await School.findById(req.params.id);
      
      if (school) {
        await school.deleteOne();
        res.json({ message: "School removed" });
      } else {
        res.status(404).json({ message: "School not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };