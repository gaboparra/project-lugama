// import mongoose, { Document, Schema, Model } from "mongoose";
// import bcrypt from "bcrypt";

// export interface IUser extends Document {
//   username: string;
//   email: string;
//   password?: string;
//   googleId?: string;
//   points: number;
//   stars: number;
//   role: "user" | "admin";
//   comparePassword(candidatePassword: string): Promise<boolean>;
// }

// const UserSchema = new Schema<IUser>(
//   {
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       minlength: [1, "The name must have at least 1 character"],
//       maxlength: [30, "The name cannot exceed 30 characters"],
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//     },
//     password: {
//       type: String,
//       required: false,
//     },
//     googleId: {
//       type: String,
//       unique: true,
//       sparse: true,
//     },
//     points: {
//       type: Number,
//       default: 0,
//     },
//     stars: {
//       type: Number,
//       default: 0,
//     },
//     role: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "user",
//     },
//   },
//   { timestamps: true },
// );

// UserSchema.pre("save", async function (this: IUser) {
//   if (!this.password || !this.isModified("password")) {
//     return;
//   }

//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   } catch (error) {
//     throw error;
//   }
// });

// UserSchema.methods.comparePassword = async function (
//   this: IUser,
//   candidatePassword: string,
// ): Promise<boolean> {
//   if (!this.password) return false;
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// export default mongoose.model<IUser>("User", UserSchema);
