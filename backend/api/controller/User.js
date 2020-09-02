const User = require("../../db-init/UserSchema");
const newToken = require("../../middlewares/token");
const bcrypt = require("bcrypt");
const decrypt = require("../../middlewares/decryption");

exports.getAllUser = async (req, res) => {
  const allUsers = await User.find();

  if (allUsers.length === 0) {
    res.status(404).json({
      message: "No Users Found",
    });
  } else {
    res.status(200).json({
      data: allUsers,
      message: "All User Fetched Succesfully",
    });
  }
};

exports.createNewUser = async (req, res, next) => {
  try {
    const isUserExist = await User.findOne({ email: req.body.email });
    if (isUserExist) {
      res.status(404).json({
        message: `Email ${isUserExist.email} Already Exist`,
      });
    } else {
      const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 10),
        address: req.body.address,
        contact: req.body.contact,
        subjects: req.body.subjects,
      });
      res.status(200).json({
        data: newUser,
        message: "User Created Succesfully",
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.loginUser = async (req, res) => {
  const userDetails = await User.findOne({ email: req.body.email });
  if (userDetails) {
    let isPwdMatched = bcrypt.compareSync(
      req.body.password,
      userDetails.password
    );
    if (!isPwdMatched) {
      res.status(400).json({
        message: "Invalid Password",
      });
    } else {
      const payload = {
        name: userDetails.name,
        _id: userDetails._id,
        email: userDetails.email,
      };
      let token = newToken.generateToken(payload);
      res.status(200).json({
        data: token,
        message: "Login Successful",
      });
    }
  } else {
    res.status(400).json({
      message: "User Not Found",
    });
  }
};

exports.getUserByEmail = async (req, res) => {
  const userDetails = await User.findOne({ email: req.params.email });
  console.log(userDetails);
  if (userDetails) {
    res.status(200).json({
      data: userDetails,
      message: "User Retrived Successfully",
    });
  } else {
    res.status(404).json({
      message: "User Not Found",
    });
  }
};

exports.updateUser = async (req, res) => {
  await User.updateOne(
    { _id: req.body.userid },
    { $set: { name: req.body.name } }
  )
    .then(() => {
      res.status(200).json({
        message: "User Updated Successfully",
      });
    })
    .catch((err) => {
      res.status(404).json({
        message: "Error While Updating User",
        err: err,
      });
    });
};

exports.deleteUser = async (req, res) => {
  const isUserExist = await User.findOne({ email: req.params.email });
  if (isUserExist) {
    await User.findByIdAndDelete(isUserExist._id)
      .then(() => {
        res.status(200).json({
          message: "User Deleted Successfully",
        });
      })
      .catch((err) => {
        res.status(404).json({
          message: "Error While Deleting User",
        });
      });
  } else {
    res.status(404).json({
      message: "User Not Found",
    });
  }
};
