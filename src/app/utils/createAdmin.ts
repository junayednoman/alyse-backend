import { startSession } from "mongoose";
import config from "../config";
import Admin from "../modules/admin/admin.model";
import Auth from "../modules/auth/auth.model";
import bcrypt from "bcrypt";

const createAdmin = async () => {
  const session = await startSession();
  const email = config.admin_email;
  try {
    session.startTransaction();
    const admin = await Admin.findOne({ email });
    const auth = await Auth.findOne({
      email,
      isDeleted: false,
      isBlocked: false,
    });
    if (admin && auth) {
      return;
    }

    const adminData = {
      name: "Admin",
      email,
    };

    const password = config.admin_password!;
    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.salt_rounds)
    );

    const newAdmin = await Admin.create([adminData], { session });

    const authData = {
      email,
      password: hashedPassword,
      role: "admin",
      user_type: "Admin",
      user: newAdmin[0]?._id,
      isAccountVerified: true
    }
    await Auth.create(
      [authData],
      { session }
    );



    await session.commitTransaction();
    return console.log(`Admin account created`);
  } catch (err: any) {
    await session.abortTransaction();
    console.log(err.message || "Error creating admin account");
  } finally {
    session.endSession();
  }
};

export default createAdmin;