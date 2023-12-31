const express = require("express");
const router = express.Router();
const Diary = require("../../models/diaries");
const Travel = require("../../models/travels");
const User = require("../../models/users");

const isAuthenticated = require("../../middleware/isAuthenticated");
router.get("/allPictures", isAuthenticated, async (req, res) => {
  try {
    // console.log(req.user.account.avatar);

    // const userId = req.query.userId;
    const user = await User.findOne({ _id: req.user._id });

    // console.log(user.travels);
    if (!user) {
      res.status(404).json({ result: false, error: "user not found" });
    }
    const travels = await Travel.find({ user: user._id });
    // console.log(travels);

    const diaryIds = [];
    for (const travel of travels) {
      diaryIds.push(...travel.travelDiary);
      // diaryIds.push();
    }
    console.log(diaryIds);
    const diaries = await Diary.find({ _id: { $in: diaryIds } });
    // console.log(diaries);
    const allImages = [];
    diaries.forEach((diary) => {
      allImages.push(...diary.moment_pictures);
    });
    // console.log(travels);
    if (allImages.length > 0) {
      res.json({
        result: true,
        avatarUrl: user.account.avatar || null,
        allImages,
      });
    } else {
      res.json({
        result: true,
        avatarUrl: user.account.avatar || null,
        allImages: [],
      });
    }
  } catch (error) {
    console.log({ error: error.message });
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
// const express = require("express");
// const router = express.Router();
// const Diary = require("../../models/diaries");
// const Travel = require("../../models/travels");
// const User = require("../../models/users");

// const isAuthenticated = require("../../middleware/isAuthenticated");

// router.get("/allPictures", isAuthenticated, async (req, res) => {
//   try {
//     const user = await User.findOne({ _id: req.user._id });

//     if (!user) {
//       return res.status(404).json({ result: false, error: "user not found" });
//     }

//     const travels = await Travel.find({ user: user._id });

//     const allImagesByTravel = [];

//     for (const travel of travels) {
//       const destinationId = travel.destination; // Assumez que c'est une chaîne de caractères

//       // const diaryIds = [...travel.travelDiary, destinationId];
//       const diaries = await Diary.find({ travel: travel._id });

//       const images = [];
//       diaries.forEach((diary) => {
//         images.push(...diary.moment_pictures);
//       });

//       if (images.length > 0) {
//         allImagesByTravel.push({
//           travel,
//           destinationId, // Stockez l'ID de la destination
//           images,
//         });
//       }
//     }

//     res.json({
//       result: true,
//       avatarUrl: user.account.avatar || null,
//       allImagesByTravel,
//     });
//   } catch (error) {
//     console.log({ error: error.message });
//     res.status(500).json({ result: false, error: error.message });
//   }
// });

// module.exports = router;
