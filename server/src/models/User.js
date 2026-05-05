import mongoose from "mongoose";

export const USER_ROLES = ["SuperAdmin", "SubAdmin", "User"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "User"
    },
    imgUrl: {
      type: String,
      default: null
    },
    emailVerifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

export default mongoose.model("User", userSchema);
