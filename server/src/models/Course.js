import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 160
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: 40
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deletedAt: {
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
        return ret;
      }
    }
  }
);

courseSchema.index({ title: "text", code: "text" });

export default mongoose.model("Course", courseSchema);
