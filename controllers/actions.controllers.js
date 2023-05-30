import Channels from "../models/Channels.js";
import mongoose from "mongoose";
import Keyword from "../models/Keyword.js";
import axios from "axios"
import { restartBot } from "../utils/restartBot.js";
import Ping from "../models/Ping.js";

export async function addChannel(req, res) {
  try {
    let {
      senderServerName,
      senderChannelId,
      senderChannelName,
      receiverServerName,
      receiverChannelName,
      receiverChannelWebhook
    } = req.body;
    let { userId } = req.userData;

    if (!senderServerName || !senderChannelId || !senderChannelName || !receiverServerName || !receiverChannelName || !receiverChannelWebhook) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required." });
    }

    const channelKeyIdentifier = `${senderChannelId}+${receiverChannelWebhook}`;

    const channelAlreadyExists = await Channels.find({ channelKeyIdentifier });
    if (channelAlreadyExists.length > 0){
      return res
        .status(409)
        .json({ success: false, error: "Channel already exists for the channelID & webhook" });
    }

    const newChannel = new Channels({
      userId,
      channelKeyIdentifier,
      senderServerName,
      senderChannelId,
      senderChannelName,
      receiverServerName,
      receiverChannelName,
      receiverChannelWebhook
    });

    await newChannel.save();

    // restart discord bot 
    await restartBot(req)

    res.status(200).json({ success: true, message: "Channel added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getChannels(req, res) {
  try {
    let { userId } = req.userData;

    const channels = await Channels.find({ userId });
    res.send(channels);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function editChannel(req, res) {
  try {
    const { _id, data } = req.body;
    if (!_id || !data) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required." });
    }

    await Channels.findByIdAndUpdate(_id, data, {
      new: true,
    });

    // restart discord bot 
    await restartBot(req)

    res.json({ success: true, message: "Channels updated successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteChannel(req, res) {
  try {
    const { _id } = req.body;
    let { userId } = req.userData;

    if (!_id) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required." });
    }

    await Channels.deleteOne({
      _id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    // restart discord bot 
    await restartBot(req)

    res.json({ success: true, message: "Channel deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function addKeywords(req, res) {
  try{
    let { userId } = req.userData;
    let { replacements, blacklist, blacklistembed } = req.body;

    if (!replacements && !blacklist && !blacklistembed) {
      return res
        .status(400)
        .json({ success: false, error: "At least one field is required." });
    }

    let existingKeywords = await Keyword.find({ userId });
    existingKeywords = JSON.parse(JSON.stringify(existingKeywords))

    console.log(existingKeywords)

    if (existingKeywords.length > 0) {
      const filter = { userId };
      const update = {
        $addToSet: {
          blacklist: { $each: blacklist },
          blacklistembed: { $each: blacklistembed }
        }
      };
      
      for (const [key, value] of Object.entries(replacements)) {
        update[`replacements.${key}`] = value;
      }
      
      const options = { upsert: true, new: true };
      const updatedKeywords = await Keyword.findOneAndUpdate(filter, update, options);

      // restart discord bot 
      await restartBot(req)

      return res.status(200).json({ success: true, message: "Keywords updated successfully" });
    }
    
    const newKeyword = Keyword({
      userId,
      replacements,
      blacklist,
      blacklistembed,
    });

    await newKeyword.save();

    // restart discord bot 
    await restartBot(req)

    res.status(200).json({ success: true, message: "Keywords added successfully" });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getKeywords(req, res) {
  try {
    let { userId } = req.userData;

    const keywords = await Keyword.find({ userId });
    res.send(keywords);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteKeyword(req, res) {
  try {
    // keyword
    // replacement: key - type string
    // blaclist && blaclistembed: word - type string 
    const { keyword, type } = req.body;
    let { userId } = req.userData;

    if (!keyword || !type) {
      return res
      .status(400)
      .json({ success: false, error: "All fields are required." });
    }

    if (type == "replacement"){
      await Keyword.updateOne(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $unset: { [`replacements.${keyword}`]: 1 } }
      ); 
    }  else if (type == "blacklist"){
      await Keyword.updateOne(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $pull: { blacklist: keyword } }
      );      
    } else if (type == "blacklistembed"){
      await Keyword.updateOne(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $pull: { blacklistembed: keyword } }
      );      
    } else {
      return res
      .status(400)
      .json({ success: false, error: "Keyword type does not exist" });
    }

    // restart discord bot 
    await restartBot(req)
    res.json({ success: true, message: "Keyword deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ==================================

export async function getPings(req, res) {
  try {
    let { userId } = req.userData;

    const pings = await Ping.find({ userId });
    res.send(pings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function addPing(req, res) {
  try {
    let {
      channelId,
      role,
    } = req.body;
    let { userId } = req.userData;

    if (!channelId || !role) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required." });
    }

    const channelAlreadyExists = await Ping.find({ channelId });
    if (channelAlreadyExists.length > 0){
      return res
        .status(409)
        .json({ success: false, error: "Channel already exists" });
    }

    const newPing = new Ping({
      userId,
      channelId,
      role
    });

    await newPing.save();

    // restart discord bot 
    await restartBot(req)

    res.status(200).json({ success: true, message: "New ping added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deletePing(req, res) {
  try {
    const { channelId } = req.body;
    let { userId } = req.userData;

    if (!channelId) {
      return res
      .status(400)
      .json({ success: false, error: "Channel ID is required." });
    }

    await Ping.deleteOne({
      userId,
      channelId
    });

    // restart discord bot 
    await restartBot(req)

    res.json({ success: true, message: "Ping deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
}


