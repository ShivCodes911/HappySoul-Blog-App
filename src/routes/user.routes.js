import express from "express";

import { signup, verifyEmail, resendVerificationOtp, login, refreshToken, logout, logoutAll,
     getCurrentUser, updateCurrentUser, changePassword, forgetPassword,
     resetPassword, profileImageUpload, newProfileImage, deleteUser } from "../controllers/user.controller.js";

import { UserAuthMidlleware } from "../middlewares/auth.middleware.js";

import {upload} from "../middlewares/upload.middleware.js";




const router=express.Router();

router.post("/signup",signup);
router.post("/verify",verifyEmail);
router.post("/resend-otp",resendVerificationOtp);

router.post("/login",login);

router.get("/refresh-token",refreshToken);

router.post("/logout",UserAuthMidlleware,logout); 

router.post("/logout-all",UserAuthMidlleware,logoutAll); 

router.get("/me",UserAuthMidlleware,getCurrentUser);

router.patch("/me",UserAuthMidlleware,updateCurrentUser);

router.patch("/change-password", UserAuthMidlleware, changePassword);

router.post("/forget-password",forgetPassword);

router.post("/reset-password", resetPassword);

router.patch("/me/profile-image",UserAuthMidlleware,upload.single("profileImage"),profileImageUpload);

//Accept ONE uploaded file
// whose form-data key is "profileImage"


router.patch("/me/newprofile-image",UserAuthMidlleware,upload.single("profileImage"),newProfileImage);
router.delete("/users/me",UserAuthMidlleware,deleteUser);




export default router;