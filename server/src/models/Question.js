import mongoose from "mongoose";

export const REVIEW_STATUSES = ["pending", "selected", "rejected"];
export const ACCESS_POLICIES = ["standard", "password", "assigned"];

const fileSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    path: String,
    url: String
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 220
    },
    questionFile: {
      type: fileSchema,
      required: true
    },
    imageFile: {
      type: fileSchema,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    reviewStatus: {
      type: String,
      enum: REVIEW_STATUSES,
      default: "pending"
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    passwordHash: {
      type: String,
      default: null
    },
    accessPolicy: {
      type: String,
      enum: ACCESS_POLICIES,
      default: "standard"
    },
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    accessExpiresAt: {
      type: Date,
      default: null
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
        ret.accessPolicy = ret.accessPolicy || (ret.passwordHash ? "password" : "standard");
        ret.hasPassword = ret.accessPolicy === "password" && Boolean(ret.passwordHash);
        ret.isExpired = Boolean(ret.accessExpiresAt && new Date(ret.accessExpiresAt) <= new Date());
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

questionSchema.index({ title: "text" });
questionSchema.index({ owner: 1, deletedAt: 1 });
questionSchema.index({ course: 1, reviewStatus: 1, isActive: 1, deletedAt: 1 });
questionSchema.index({ accessPolicy: 1, allowedUsers: 1, accessExpiresAt: 1 });

export default mongoose.model("Question", questionSchema);
