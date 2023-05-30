import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types

const keywordsSchema = new mongoose.Schema(
  {
    userId: {
        type: ObjectId,
        ref: "users"
    },
    replacements: {
        type: Map,
        of: String,
        unique: true,
    },
    blacklist: {
        type: [String],
        unique: true,
    },
    blacklistembed: {
        type: [String],
        unique: true,
    }
  },
  { timestamps: true }
);


export default mongoose.model("keywords", keywordsSchema);