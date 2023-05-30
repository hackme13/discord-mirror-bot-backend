import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types

const pingSchema = new mongoose.Schema(
  {
    userId: {
        type: ObjectId,
        ref: "users"
    },
    channelId: {
        type: String,
        require: true,
        unique: true
    },
    role: {
        type: String,
        require: true
    }
  },
  { timestamps: true }
);


export default mongoose.model("pings", pingSchema);