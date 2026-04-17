import express from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../db.js";
import { JWT_SECRET } from "../config.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
  username: z.string().min(3).max(30),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const updateSchema = z.object({
  password: z.string().min(6).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

router.post("/signup", async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);

    const existingUser = await User.findOne({ username: body.username });
    if (existingUser) {
      return res.status(411).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = new User({
      username: body.username,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.json({ message: "User created successfully", token });
  } catch (error) {
    res.status(411).json({ message: "Invalid input" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const body = signinSchema.parse(req.body);

    const user = await User.findOne({ email: body.email });
    if (!user) {
      return res.status(411).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      return res.status(411).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    res.json({ message: "Signed in successfully", token });
  } catch (error) {
    res.status(411).json({ message: "Invalid input" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(411).json({ message: "Failed to fetch user" });
  }
});

router.put("/", authMiddleware, async (req, res) => {
  try {
    const body = updateSchema.parse(req.body);

    const updateData: any = {};
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
    }).select("-password");

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(411).json({ message: "Invalid input" });
  }
});

router.get("/bulk", async (req, res) => {
  try {
    const filter = (req.query.filter as string) || "";

    const users = await User.find({
      $or: [
        { firstName: { $regex: filter, $options: "i" } },
        { lastName: { $regex: filter, $options: "i" } },
      ],
    }).select("username firstName lastName _id");

    res.json(users);
  } catch (error) {
    res.status(411).json({ message: "Failed to fetch users" });
  }
});

export default router;
