import { User, IUser } from "../models/user";

export const getAllUsers = async () => await User.find({});

export const getUserById = async (_id: string) => await User.findOne({ _id });

export const getUserByEmail = async (email: string) =>
  await User.findOne({ email });

export const editUser = async (
  user: Partial<Omit<IUser, "refreshTokens">>,
  id: string,
) => await User.findByIdAndUpdate(id, user, { new: true });

export const deleteUser = async (userId: string) =>
  await User.deleteOne({ _id: userId });
