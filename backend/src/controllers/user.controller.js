import bcrytp from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { inngest } from '../../inngest/client.js';
import ApiError from '../utils/api-error.js';
import { env } from '../config/env.js';
import { ApiResponse } from '../utils/api-response.js';

const registerUser = async (req, res) => {
  const { email = '', password = '', skills = [] } = req.body || {};

  if (!email || !password) {
    return res.status(400).json(new ApiError(400, 'All Fields are required'));
  }
  try {
    const hashedPassword = await bcrytp.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
    });
    if (skills.length) {
      const distinctSkills = [...new Set(skills)];
      newUser.skills = distinctSkills;
    }
    await newUser.save();
    await inngest.send({
      name: 'user/signup',
      data: {
        email,
      },
    });
    return res
      .status(200)
      .json(new ApiResponse(200, { newUser }, 'User registered Successfully'));
  } catch (error) {
    console.error('Internal Server Error at loginUser : ', error.message);
    res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at loginUser'));
  }
};

const loginUser = async (req, res) => {
  const { email = '', password = '' } = req.body;
  if (!email || !password) {
    return res.status(400).json(new ApiError(400, 'All Fields are required'));
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(new ApiError(404, 'User not registered yet'));
    }
    const isPasswordCorrect = await bcrytp.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json(new ApiError(400, 'Invalid Credtentials'));
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      env.JWT_SECRET,
      {
        expiresIn: '24h',
      }
    );

    const cookieOptions = {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      secure: true, // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      // sameSite: 'Strict', // Prevents CSRF attacks by ensuring the cookie is sent only for same-site requests
      sameSite: 'None', // Allow setting Cookies for Cross Origin requests  too .
    };

    res.cookie('token', token, cookieOptions);
    return res
      .status(200)
      .json(new ApiResponse(200, { user }, 'User logged in successfully'));
  } catch (error) {
    console.error('Internal Server Error at loginUser', error);
    res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at loginUser'));
  }
};
const logoutUser = async (req, res) => {
  try {
    //Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'User logged out successfully'));
  } catch (error) {
    console.error('Error in logoutUser:', error);
    return res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at logoutUser'));
  }
};

const updateUser = async (req, res) => {
  const { skills = [], role, email = '' } = req.body;
  if (skills.length && !role) {
    return res
      .status(400)
      .json(new ApiError(400, 'Add something to update User'));
  }
  if (!email) {
    return res
      .status(400)
      .json(new ApiError(400, 'Email is required to find the user '));
  }

  try {
    if (req.user.role !== 'admin') {
      return res
        .status(403)
        .json(new ApiError(403, 'Forbidden - Not authorized - not an admin '));
    }
    const user = await User.findOne({ email }).select('-password');
    if (!user) {
      return res.status(404).json(new ApiError(404, 'User not found'));
    }

    if (role) {
      user.role = role;
    }
    const distinctSkills = [...new Set(skills)];
    if (skills.length) {
      distinctSkills.forEach((skill) => {
        //Todo ckeck for similar skills to filter out only the distinct one
        user.skills.push(skill);
      });
    }
    await user.save();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user },
          'User Profile updated successfully by admin  '
        )
      );
  } catch (error) {
    console.error('Internal Server Error at updateUser', error.message);
    res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at  updateUser'));
  }
};

const getAllUsersDetails = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(new ApiError(403, 'Forbidden -  cant fetch'));
    }

    const users = await User.find().select('-password');
    if (users.length == 0) {
      return res
        .status(404)
        .json(new ApiError(404, 'No any users in database'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { users }, 'Fetched all users successfully'));
  } catch (error) {
    console.error('Internal Server Error at getAllUsersDetails', error.message);
    res
      .status(500)
      .json(new ApiError(500, 'Internal Server Error at  getAllUsersDetails'));
  }
};

export { registerUser, loginUser, logoutUser, updateUser, getAllUsersDetails };
