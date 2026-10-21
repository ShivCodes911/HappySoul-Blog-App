import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";
import bcrypt from "bcrypt";
import otpModel from "../models/otp.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto"
import streamifier from "streamifier";



import {generateOtp,getOtpHtml} from "../utils/utils.js";
import {sendEmail} from "../services/email.service.js";
import { loginPostRequestBodySchema, signupPostRequestBodySchema ,verifyEmailPostRequestBodySchema,updateCurrentUserRequestBodySchema, changePasswordPostBodySchema, forgotPasswordEmailBodySchema, resetPasswordBodySchema} from "../validators/user.validator.js";
import cloudinary from "../config/cloudinary.config.js";
import postModel from "../models/post.model.js";
import commentModel from "../models/comment.model.js";
import bookmarkModel from "../models/bookmark.model.js";
import likeModel from "../models/like.model.js";




export async function signup(req, res) {
  try {
    const validationResult = await signupPostRequestBodySchema.safeParseAsync(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        status: "failed",
        error: validationResult.error.message,
      });
    }

    const { name, email, password } = validationResult.data;

    const existingUser = await userModel.findOne({ email });

    // If already registered and verified, prompt them to log in
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        status: "failed",
        message: `An account with email ${email} already exists. Please log in instead.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (existingUser && !existingUser.isVerified) {
      // Allow re-registering/updating credentials for unverified accounts
      existingUser.name = name;
      existingUser.password = hashedPassword;
      user = await existingUser.save();
      // Remove any previously issued, unverified OTPs
      await otpModel.deleteMany({ email, purpose: "email-verification" });
    } else {
      user = await userModel.create({
        name,
        email,
        password: hashedPassword,
      });
    }

    const otp = generateOtp();
    const html = getOtpHtml(otp);
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await otpModel.create({
      email,
      hashedOtp,
      user: user._id,
      purpose: "email-verification",
    });

    try {
      await sendEmail(email, "OTP verification", `Your Otp code is ${otp} for 10 min`, html);
    } catch (emailError) {
      console.error("[Signup] Failed to send verification email:", emailError);
      return res.status(500).json({
        status: "failed",
        message: `Account created, but failed to send verification email: ${emailError.message || "Email error"}. Please check your email configuration on Render.`,
      });
    }

    return res.status(200).json({
      status: "success",
      msg: "User created Successfully. Verification code sent to your email.",
      user: {
        name: user.name,
        email: user.email,
        Verified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("[Signup Error]", error);
    return res.status(500).json({
      status: "failed",
      message: error.message || "Internal Server Error",
    });
  }
};


export const verifyEmail = async (req, res) => {
  try {
    // Validate Request Body
    const validationResult =
      await verifyEmailPostRequestBodySchema.safeParseAsync(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        status: false,
        message: validationResult.error.message,
      });
    }

    const { otp, email } = validationResult.data;

    // Hash OTP
    const otpHash = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    // Find OTP Document
    const otpDoc = await otpModel.findOne({
      email,
      hashedOtp:otpHash,
    });

    // Invalid OTP
    if (!otpDoc) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP",
      });
    }

    // Check OTP Expiry
    if (otpDoc.expiresAt < new Date()) {
      await otpModel.deleteMany({ email });

      return res.status(400).json({
        status: false,
        message: "OTP Expired",
      });
    }

    // Find User
    const existingUser = await userModel.findById(otpDoc.user);

    if (!existingUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Already Verified
    if (existingUser.isVerified) {
      return res.status(400).json({
        status: false,
        message: "User already verified",
      });
    }

    // Verify User
    const updatedUser = await userModel.findByIdAndUpdate(
      otpDoc.user,
      {
        isVerified: true,
      },
      {
        new: true,
      }
    );

    // Delete all OTPs for user
    await otpModel.deleteMany({
      user: otpDoc.user,
    });

    // Success Response
    return res.status(200).json({
      status: true,
      message: "Email verified successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
      },
    });

  } catch (error) {
    console.error("Verify Email Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const login = async (req,res)=>{
    try {
      const validationResult=await loginPostRequestBodySchema.safeParseAsync(req.body);

      if(!validationResult.success){
         return res.status(400).json({
            status:false,
            meassge:validationResult.error.message
         })
      }

      const {email,password} = validationResult.data
      const existingUser = await userModel.findOne({email});

      if(!existingUser){
         return res.status(404).json({
            status:false,
            message:"User not Found signUp first "
         })
      }

      if(!existingUser.isVerified){
         return res.status(400).json({
            status:false,
            message:"Email not Verified, verify your Email first!"
         });
      }

      const isMatch=await bcrypt.compare(password,existingUser.password);

      if(!isMatch){
         return res.status(401).json({
            status:false,
            message:"Incorrect Password"
         })
      };


      const refreshToken= jwt.sign({id:existingUser._id},process.env.REFRESH_TOKEN_SECRET,{expiresIn:"7d"})
      
      const refreshTokenHash=  crypto.createHash("sha256").update(refreshToken).digest("hex");

      const session=await sessionModel.create({
         userId:existingUser._id,
         hash:refreshTokenHash,
         ip:req.ip,
         userAgent:req.headers["user-agent"],
         
      });

      const accessToken= jwt.sign({id:existingUser._id,sessionId:session._id},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"});

      res.cookie("refreshToken",refreshToken,{
         httpOnly:true,
         secure:process.env.NODE_ENV==="production", //true in production
        sameSite:process.env.NODE_ENV=="production"?"none":"strict",// none in production
        maxAge:7*24*60*60*1000 //7days in milliseconds
        });
      

        return res.status(200).json({
            status:true,
            message:"Login Successfull",
            user:{
               profileImage: existingUser.profileImage,
               name: existingUser.name,
               email: existingUser.email,
               id: existingUser._id,
               isVerified: existingUser.isVerified,
            },
            token:accessToken,
        });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
         status:false,
         message:"Internal Server Error",
         error:error.message
      });
      
    }
}


export const refreshToken= async (req,res)=>{
  try {
    const refreshToken=req.cookies.refreshToken;

    if(!refreshToken){
      return res.status(401).json({
        status:false,
        message:"You are not logged in"
      })
    }

    const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);

    const hashedrefreshToken= crypto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.findOne({
      hash:hashedrefreshToken,
      revoked:false
    });

    if(!session){
      return res.status(401).json({
        status:false,
        message:"Invalid Session or token is revoked"
      })
    }

    const accessToken=jwt.sign({id:decoded.id,sessionId:session._id},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"}); 
    const newRefreshToken= jwt.sign({id:decoded.id},process.env.REFRESH_TOKEN_SECRET,{expiresIn:"7d"});

    const newRefreshTokenHash=crypto.createHash("sha256").update(newRefreshToken).digest("hex");


    await sessionModel.findOneAndUpdate(
      {_id:session._id},
    {
      hash:newRefreshTokenHash
    });

    res.cookie("refreshToken",newRefreshToken,{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:process.env.NODE_ENV==="production"?"none":"strict",
      maxAge:7*24*60*60*1000
    })

    return res.status(200).json({
      status:true,
      message:"Token Refreshed Successfully",
      token:accessToken,
    });


} catch (error) {
  console.error(error);
  return res.status(500).json({
    status:false,
    message:"Internal Server Error",
    error:error.message,
  });
    
  }
}


export const logout=async (req,res)=>{

  try {
    const refreshToken=req.cookies.refreshToken;

  if(!refreshToken){
    return res.status(401).json({
      status:false,
      message:"You are not logged in"
    });
  }

  const hashedrefreshToken=crypto.createHash("sha256").update(refreshToken).digest("hex");

  const session=await sessionModel.findOne({
    hash:hashedrefreshToken,
    revoked:false
  })

  if(!session){
    return res.status(401).json({
      status:false,
      message:"Invalid refresh Token"
    })
  }

  session.revoked=true;
  await session.save();


res.clearCookie("refreshToken",{
   httpOnly:true,
   secure:process.env.NODE_ENV==="production",
   sameSite:process.env.NODE_ENV==="production"?"none":"strict",
});

  return res.status(200).json({
    status:true,
    message:"Logged Out Successfully"
  })
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status:false,
      message:"Internal Server Error",
      error:error.message,
    })
  }
}


export const logoutAll=async (req,res)=>{
  try {
    const refreshToken=req.cookies.refreshToken;

    if(!refreshToken){
      return res.status(401).json({
        status:false,
        message:"You are not logged in"
      })
    }

    const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
    
     await sessionModel.updateMany({
      userId:decoded.id,
      revoked:false
    },{
      revoked:true
    });

    res.clearCookie("refreshToken",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:process.env.NODE_ENV==="production"?"none":"strict",
      maxAge:7*24*60*60*1000
    })

    return res.status(200).json({
      status:true,
      message:"Logged Out of all the devices successfully",
    })
    
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status:false,
      message:"Internal Server Error",
      error:error.message,
    })
    
  }
};


export const getCurrentUser=async(req,res)=>{
  try {
    const user=await userModel.findById(req.user.id).select("-password"); // "-paasword"=> exclude password and select

    return res.status(200).json({
      status:true,
      message:"Here are you details",
      user
    })
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error"
    })
    
  }
};

export const updateCurrentUser=async(req,res)=>{
  try {
    const validationResult=await updateCurrentUserRequestBodySchema.safeParseAsync(req.body);

    if(!validationResult.success){
      return res.status(400).json({
        status:false,
        message:"Body is Invalid"
      })
    }
    const {updatedName}=validationResult.data;

    const user = await userModel.findById(req.user.id);

    if(!user){
      return res.status(404).json({
        status:false,
        message:"User is not authorized"
      })
    }

    user.name=updatedName;
    await user.save();

    return res.status(200).json({
      status:true,
      message:"User Name has Been Updated Succesfully !",
      updatedName
    })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error"
    })
    
  }
};

export const changePassword=async(req,res)=>{
try {
  const validationResult=await changePasswordPostBodySchema.safeParseAsync(req.body);

  if(!validationResult.success){
    return res.status(400).json({
      status:false,
      message:"password type is Invalid"
    })
  }

  const {oldPassword,newPassword} = validationResult.data;

  const user=await userModel.findById(req.user.id);

  if(!user){
    return res.status(404).json({
      status:false,
      message:"User is not authorized ! "
    })
  }

 const comparePassword= await bcrypt.compare(oldPassword,user.password);

 if(!comparePassword){
  return res.status(400).json({
    status:false,
    message:"Invalid password, Enter again"
  })
 }

 const hashedNewPassword=await bcrypt.hash(newPassword,10);

 user.password=hashedNewPassword;
 await user.save();

 return res.status(200).json({
  status:true,
  message:"Password changed Successfully !!! "
 })
} catch (error) {
  console.error(error);
  return res.status(500).json({
    status:false,
    message:"Internal Server Error !! "
  })
  
}

};

export const forgetPassword=async(req,res)=>{
  try {
    const validationResult= await forgotPasswordEmailBodySchema.safeParseAsync(req.body);

    if(!validationResult.success){
      return res.status(400).json({
        status:false,
        message:"Enter valid Email"
      })
    }

    const {email}=validationResult.data;

    const user = await userModel.findOne({email});

    if(!user){
      return res.status(404).json({
        status:false,
        message:"User not found, please signup"
      })
    }

    const otp=generateOtp();
    const html=getOtpHtml(otp);

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await otpModel.deleteMany({  //=> remove old reset OTPs
   email, 
   purpose:"password-reset"
});

  await otpModel.create({  //=> create only one fresh OTP
      email,
      hashedOtp,
      user:user._id,
      purpose:"password-reset"
    });

    await sendEmail(email,"Password Reset OTP",`Your Otp is ${otp} for next 10 min`,html);

    return res.status(200).json({
        status:"success",
        msg:"Password reset OTP sent successfully",
        user:{
            name:user.name,
            email:user.email,
            Verified:user.isVerified,
        },
      });

    } catch (error) {
    console.error(error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error"
    })
    
  }
};

export const resetPassword=async(req,res)=>{
  try {
    const validationResult=await resetPasswordBodySchema.safeParseAsync(req.body);

    if(!validationResult.success){
      return res.status(400).json({
        status:false,
        message:"Enter the credential Properly"
      })
    }

    const {email,otp,newPassword}=validationResult.data;

    const hashedOtp= crypto.createHash("sha256").update(otp).digest("hex");

    const otpDoc = await otpModel.findOne({
      email,
      hashedOtp,
      purpose:"password-reset"
    })

    if(!otpDoc){
      return res.status(400).json({
        status:false,
        message:"Email or Otp is Incorrect"
      })
    }

    if(otpDoc.expiresAt < new Date()){

        await otpModel.deleteOne({_id:otpDoc._id});  // this delete expire otp

      return res.status(400).json({
        status:false,
        message:"Otp expired & Enter again"
      })
    }
  const user = await userModel.findOne({email});
    if(!user){
      return res.status(404).json({
        status:false,
        message:"User does Not Exist"

      })
    }

    const hashedPassword=await bcrypt.hash(newPassword,10);

    user.password=hashedPassword;
    await user.save();

     await otpModel.deleteOne({_id:otpDoc._id}); 
     
     return res.status(200).json({
      status:true,
      message:"Password Reset Succesfully "
    })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error ! "
    })
    
  }
};

export const profileImageUpload = async(req,res)=>{
   try {

      if(!req.file){
         return res.status(400).json({
            status:false,
            message:"Image file is required"
         });
      }

      const result = await new Promise((resolve,reject)=>{

         const stream = cloudinary.uploader.upload_stream(
            {
               folder:"profile-images"
            },
            (error,result)=>{

               if(error){
                  reject(error);
               }else{
                  resolve(result);
               }

            }
         );

         streamifier
            .createReadStream(req.file.buffer)
            .pipe(stream);

      });

      const user = await userModel.findById(req.user.id);

      if(!user){
         return res.status(404).json({
            status:false,
            message:"User not found"
         });
      }

      user.profileImage = {
        url:result.secure_url,
        public_id:result.public_id
      }

      await user.save();

      return res.status(200).json({
         status:true,
         message:"Profile image uploaded successfully",
         profileImage:user.profileImage
      });

   } catch (error) {

      console.error(error);

      return res.status(500).json({
         status:false,
         message:"Internal Server Error"
      });

   }
};

export const newProfileImage=async(req,res)=>{
  try {
    if(!req.file){
      return res.status(400).json({
        status:false,
        message:"No file in input"
      })
    }

    const result=await new Promise((resolve,reject)=>{

      const stream=cloudinary.uploader.upload_stream(
        {
        folder:"profile-images"
      },
      (error,result)=>{
        if(error){
          reject(error)
        }else{
          resolve(result)
        }
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);

    });
    const user = await userModel.findById(req.user.id);

      if(!user){
         return res.status(404).json({
            status:false,
            message:"User not found"
         });
      }

    const oldPublicId= user.profileImage?.public_id;

    if(oldPublicId){
     await cloudinary.uploader.destroy(oldPublicId);
    }

    user.profileImage={
      url:result.secure_url,
      public_id:result.public_id
    }
    await user.save();

    return res.status(200).json({
      status:true,
      message:"Profile picture updated successfully",
      profileImage:user.profileImage

    });
} catch (error) {
    console.error(error);
    return res.status(500).json({
      status:false,
      message:"Internal Server error "
    })
  }
};


export const deleteUser=async(req,res)=>{
  try {
    const id=req.user.id;
    if(!id){
      return res.status(403).json({
        status:false,
        message:"User is not authorized ! "
      })
    }

   const user=await userModel.findById(id);
   if(!user){
    return res.status(404).json({
      status:false,
      message:"USer does not Exist"
    })
   }
   const profileImg=user.profileImage?.public_id

   if(profileImg){
    await cloudinary.uploader.destroy(profileImg);
   }

   const userPosts =await postModel.find({author:id});
   
    for (const post of userPosts){ // going on every post of userPosts
      const oldCoverImageId=post.coverImage?.public_id;

      if(oldCoverImageId){
        await cloudinary.uploader.destroy(oldCoverImageId);
      }
    }

    const postIds=userPosts.map(post => post._id);

    await postModel.deleteMany({author:id});

    await bookmarkModel.deleteMany({post:{$in:postIds}});
    await bookmarkModel.deleteMany({user:id});

    await likeModel.deleteMany({post:{$in:postIds}});
    await likeModel.deleteMany({user:id});

    await commentModel.deleteMany({post:{$in:postIds}});
    await commentModel.deleteMany({author:id});

    await otpModel.deleteMany({user:id});
    await sessionModel.deleteMany({userId:id});

    await user.deleteOne();

    res.clearCookie("refreshToken",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:process.env.NODE_ENV==="production"?"none":"strict",

    });

    return res.status(200).json({
      status:true,
      message:"Account deleted Successfully "
    })

} catch (error) {
    console.error(error);
    return res.status(500).json({
      status:false,
      message:"Internal Server Error"
    })
  }
};

export async function resendVerificationOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: false, message: "Email is required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found with this email" });
    }

    if (user.isVerified) {
      return res.status(400).json({ status: false, message: "Account is already verified. Please log in." });
    }

    // Invalidate old unverified OTPs
    await otpModel.deleteMany({ email, purpose: "email-verification" });

    const otp = generateOtp();
    const html = getOtpHtml(otp);
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await otpModel.create({
      email,
      hashedOtp,
      user: user._id,
      purpose: "email-verification",
    });

    await sendEmail(email, "OTP verification", `Your Otp code is ${otp} for 10 min`, html);

    return res.status(200).json({
      status: true,
      message: "New verification code sent to your email.",
    });
  } catch (error) {
    console.error("[Resend OTP] Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to resend verification code",
    });
  }
}