import Combination from "../models/combination.js";

export const createCombination = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if Combination  with the same name already exists
    const CombinationExists = await Combination.findOne({ name });
    if (CombinationExists) {
      return res
        .status(400)
        .json({ message: "School with this name already exists" });
    }

    const combination = await Combination.create({
      name,
    });

    if (combination) {
      res.status(201).json({
        _id: combination._id,
        name: combination.name,
        createdAt: combination.createdAt,
      });
    } else {
      res.status(400).json({ message: "Invalid Combination data" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCombinations = async (req, res) => {
  try {
    const combination = await Combination.find({}).sort({ createdAt: -1 });
    res.json(combination);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCombinationById = async (req, res) => {
  try {
    const school = await Combination.findById(req.params.id);

    if (school) {
      res.json(school);
    } else {
      res.status(404).json({ message: "Combination not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCombination = async (req, res) => {
  try {
    const { name } = req.body;

    const combination = await Combination.findById(req.params.id);

    if (combination) {
      combination.name = name || combination.name;

      const updatedCombination = await Combination.save();

      res.json({
        _id: updateCombination._id,
        name: updatedCombination.name,
        location: updatedCombination.location,
        createdAt: updatedCombination.createdAt,
      });
    } else {
      res.status(404).json({ message: "Combination not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCombination = async (req, res) => {
  try {
    const combination = await Combination.findById(req.params.id);

    if (combination) {
      await combination.deleteOne();
      res.json({ message: "Combination removed" });
    } else {
      res.status(404).json({ message: "Combination not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
