const express = require('express');
const router = express.Router();
const uid2 = require('uid2');
const SHA256 = require('crypto-js/sha256');
const encBase64 = require('crypto-js/enc-base64');
const cloudinary = require('cloudinary').v2;
const convertToBase64 = require('../utils/convertToBase64');
const Diary = require('../models/diaries');
const Travel = require('../models/travels');
const User = require('../models/users');
const isAuthenticated = require('../middleware/isAuthenticated');
const { check, validationResult } = require('express-validator');

// router.post(
//   '/signup',
//   [
//     check('email')
//       .isEmail()
//       .withMessage('Invalid email address format')
//       .normalizeEmail(),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         result: false,
//         errors: errors.array(),
//       });
//     }
//     try {
//       const user = await User.findOne({
//         email: req.body.email,
//       });
//       console.log(user);
//       if (user) {
//         return res
//           .status(409)
//           .json({ message: 'This email already has an account' });
//       }
//       if (req.body.username && req.body.email && req.body.password) {
//         const token = uid2(64);
//         const salt = uid2(16);

//         const hash = SHA256(req.body.password + salt).toString(encBase64);

//         const newUser = await new User({
//           salt: salt,
//           hash: hash,
//           token: token,
//           email: req.body.email,
//           firstname: req.body.firstname,
//           lastname: req.body.lastname,
//           account: {
//             username: req.body.username,
//           },

//           //!  password: password, ne pas enregistrer où le placer dans la nouvelle variable
//         });

//         if (req.files && req.files?.avatar) {
//           try {
//             const result = await cloudinary.uploader.upload(
//               convertToBase64(req.files.avatar),

//               {
//                 folder: `memories/users/${newUser._id}`,
//                 public_id: 'avatar',
//               }
//             );
//             ///${newUser._id}
//             // console.log(result); //celui qui renvoie toutes les infos utilisateurs
//             // console.log(req.files.avatar);
//             newUser.account.avatar = result.secure_url;
//             // newUser.account.avatar = result.public_id;
//           } catch (error) {
//             console.error('Cloudinary upload error:', error);
//             return res.status(500).json({ message: 'Avatar upload failed' });
//           }
//         }

//         await newUser.save();
//         res.status(201).json({
//           user: {
//             _id: newUser._id,
//             token: newUser.token,
//             email: newUser.email,
//             account: newUser.account,
//             lastname: newUser.lastname,
//             firstname: newUser.firstname,
//           },
//         });
//         // console.log(newUser);
//       } else {
//         res.status(401).json({ message: 'missing parameters' });
//       }
//     } catch (error) {
//       console.log(error.message);
//       res.status(500).json({ message: error.message });
//     }
//   }
// );
router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Invalid email address format')
      .normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        result: false,
        errors: errors.array(),
      });
    }
    try {
      const user = await User.findOne({
        email: req.body.email,
      });
      if (user) {
        return res
          .status(409)
          .json({ message: 'This email already has an account' });
      }

      if (req.body.username && req.body.email && req.body.password) {
        const token = uid2(64);
        const salt = uid2(16);
        const hash = SHA256(req.body.password + salt).toString(encBase64);

        const newUser = new User({
          salt: salt,
          hash: hash,
          token: token,
          email: req.body.email,
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          account: {
            username: req.body.username,
          },
        });

        if (req.files && req.files.avatar) {
          try {
            const base64Image = await convertToBase64(req.files.avatar);
            console.log(base64Image);
            // Upload optimized image to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(base64Image, {
              folder: `memories/users/${newUser._id}`,
              public_id: 'avatar',
              transformation: [
                {
                  width: 500,
                  height: 500,
                  crop: 'limit',
                  gravity: 'auto',
                  fetch_format: 'auto',
                  quality: 'auto',
                }, // Transformation pour ajuster la taille
              ],
            });

            // Stockez l'URL sécurisée de l'image
            newUser.account.avatar = uploadResult.secure_url;
          } catch (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ message: 'Avatar upload failed' });
          }
        }

        await newUser.save();
        res.status(201).json({
          user: {
            _id: newUser._id,
            token: newUser.token,
            email: newUser.email,
            account: newUser.account,
            lastname: newUser.lastname,
            firstname: newUser.firstname,
          },
        });
      } else {
        res.status(401).json({ message: 'missing parameters' });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  '/login',

  [
    check('email')
      .isEmail()
      .withMessage('Invalid email address format')
      .normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        result: false,
        errors: errors.array(),
      });
    }

    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return res.status(404).json({
          result: false,
          error: 'User not found',
        });
      }

      // Est-ce qu'il a rentré le bon mot de passe ?

      if (
        SHA256(req.body.password + user.salt).toString(encBase64) === user.hash
      ) {
        return res.status(200).json({
          user: {
            token: user.token,
            email: user.email,
            account: user.account,
            lastname: user.lastname,
            firstname: user.firstname,
            travels: user.travels._id,
          },
        });
      } else {
        return res.status(401).json({ result: false, error: 'Unauthorized' });
      }
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .json({ result: false, error: 'An error occurred' });
    }
  }
);

// TODO DELETE USER

router.delete('/deleteUser', async (req, res) => {
  // console.log(req.query);
  try {
    if (!req.query.token) {
      res.status(401).json({ result: false, message: 'user not found' });
      return;
    }
    const userToDelete = await User.findOneAndDelete({
      token: req.query.token,
    });

    if (!userToDelete) {
      return res.status(402).json({
        result: false,
        message:
          'your account is not found maybe you have to go create one new and travel',
      });
    }
    if (userToDelete) {
      // console.log(userToDelete);
      if (
        !userToDelete.account.avatar.secure_url ||
        userToDelete.account.avatar.secure_url
      ) {
        // Supprimer les voyages associés à l'utilisateur
        await Travel.deleteMany({ user: userToDelete._id });

        // Supprimer les journaux associés aux voyages supprimés
        await Diary.deleteMany({ travel: { $in: userToDelete.travels } });

        await cloudinary.api.delete_resources_by_prefix(
          `memories/users/${userToDelete._id}`
        );
        await cloudinary.api.delete_folder(
          `memories/users/${userToDelete._id}`
        );
        return res.status(201).json({ result: true, user: userToDelete });
      }

      // Supprimer les voyages associés à l'utilisateur
    }
    await userToDelete.remove();
  } catch (error) {
    console.error({ error: error.message });
    res.status(500).json({ result: false, error: 'An error occurred' });
  }
});
// TODO UPDATE USER PROFIL AND TRY AGAIN WITH AVATAR

router.put(
  '/updateUser',
  isAuthenticated,
  [
    check('email')
      .isEmail()
      .withMessage('Invalid email address format')
      .normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        result: false,
        errors: errors.array(),
      });
    }
    try {
      const userId = req.user._id;
      const userUpdates = {};

      if (req.body.username) userUpdates.account.username = req.body.username;
      if (req.body.firstname) userUpdates.firstname = req.body.firstname;
      if (req.body.lastname) userUpdates.lastname = req.body.lastname;
      if (req.body.email) userUpdates.email = req.body.email;
      if (req.body.newPassword) {
        const newSalt = uid2(16);
        const newPasswordHash = SHA256(req.body.newPassword + newSalt).toString(
          encBase64
        );
        userUpdates.hash = newPasswordHash;
        userUpdates.salt = newSalt;
      }

      if (req.files?.avatar) {
        if (!userUpdates['account.avatar']) userUpdates['account.avatar'] = {};

        if (userUpdates['account.avatar'].public_id) {
          await cloudinary.uploader.destroy(
            userUpdates['account.avatar'].public_id
          );
        }

        const uploadedUserAccountAvatar = await cloudinary.uploader.upload(
          convertToBase64(req.files.avatar),
          {
            folder: `memories/users/${userId}`,
            public_id: 'avatar',
          }
        );
        userUpdates['account.avatar'].secure_url =
          uploadedUserAccountAvatar.secure_url;
        userUpdates['account.avatar'].public_id =
          uploadedUserAccountAvatar.public_id;
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { $set: userUpdates },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ result: false, error: 'User not found' });
      }

      res.status(200).json({ result: true, user: updatedUser });
    } catch (error) {
      console.error({ error: error.message });
      res.status(500).json({ result: false, error: 'An error occurred' });
    }
  }
);
module.exports = router;
