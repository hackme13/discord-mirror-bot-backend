import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types

const channelsSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "users"
    },
    channelKeyIdentifier: {
      type: String,
      require: true,
      unique: true
    },
    senderServerName: {
      type: String,
      required: true,
    },
    senderChannelId: {
      type: String,
      required: true,
    },
    senderChannelName: {
      type: String,
      required: true,
    },
    receiverServerName: {
      type: String,
      required: true,
    },
    receiverChannelName: {
      type: String,
      required: true,
    },
    receiverChannelWebhook: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);


export default mongoose.model("channels", channelsSchema);