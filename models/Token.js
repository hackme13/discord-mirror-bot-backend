import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types

const tokenSchema = new mongoose.Schema(
  {
    userId: {
        type: ObjectId,
        ref: "users"
    },
    token: {
        type: String,
        required: true,
        unique: true
    }
  },
  { timestamps: true }
);


export default mongoose.model("token", tokenSchema);