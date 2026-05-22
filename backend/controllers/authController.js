export const loginUser = async (req, res) => {

  try {

    const loginTime = new Date();

    res.status(200).json({
      message: "Login successful",
      loginTime,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};



export const logoutUser = async (req, res) => {

  try {

    const logoutTime = new Date();

    res.status(200).json({
      message: "Logout successful",
      logoutTime,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};