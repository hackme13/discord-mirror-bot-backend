import Token from "../models/Token.js";
import { restartBot } from "../utils/restartBot.js";

export async function saveToken(req, res) {
  try {
      let { token } = req.body;
      let { userId } = req.userData;

      const tokenCount = await Token.find({ userId })

      if (tokenCount.length > 0){
        return res
          .status(400)
          .json({ success: false, error: "Only one token is allowed" });
      }

      const newToken = new Token({
        userId,
        token
      })

      await newToken.save()

      // restart discord bot 
      await restartBot(req)

      res.json({ success: true, message: "Token added successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: error.message });
    }
}

export async function getToken(req, res) {
    try {
        let { userId } = req.userData;
    
        const token = await Token.find({ userId })
        if (!token.length){
          return res.status(200).json(({ success: true, token: ""}))
        }

        res.json({ success: true, token: token[0].token });
      } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
      }
}

export async function updateToken(req, res) {
    try {
        const { existingToken, newToken } = req.body;
        let { userId } = req.userData;

        if (!existingToken || !newToken) {
          return res
            .status(400)
            .json({ success: false, error: "All fields are required." });
        }

        await Token.findOneAndUpdate(
          { userId },
          { $set: { token: newToken } },
          { new: true }
        )

        // restart discord bot 
        await restartBot(req)
    
        res.json({ success: true, newToken: newToken, message: "Token updated successfully." });
      } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
      }
}