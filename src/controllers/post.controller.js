import cloudinary from "../config/cloudinary.config.js";
import postModel from "../models/post.model.js";
import streamifier from "streamifier";
import jwt from "jsonwebtoken";


import {createPostRequestBodySchema,deletePostIdSchema,getPostByIdSchema, updatePostDataSchema,updatePostIdSchema,togglePublishSchema, validatePostIdSchema} from "../validators/post.validator.js";




export const createPost=async(req,res)=>{
    try {
        const validationResult=await createPostRequestBodySchema.safeParseAsync(req.body);

        if(!validationResult.success){
            return res.status(400).json({
                status:false,
                message:"Invalid Data"
            });
        };

            // to obtain id from auth middleware
        const userId=req.user.id;

        if(!userId){
            return res.status(400).json({
                status:false,
                message:"You are not authorized to use this feature"
            });
        };

        const {title,content}=validationResult.data;


        const post = await postModel.create({
            title,
            content,
            author:userId,           //here userId is from req.user.id which we are sending from auth.middleware(req.user)
        });


        return res.status(200).json({
            status:true,
            message:"Post Created Successfully",
            post
        });
        
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status:false,
            message:"Internal server error"
        });
        
    }
};

export const getAllPost=async(req,res)=>{
    try {
        //pagination
        const page=Number(req.query.page) || 1;
        const limit=Number(req.query.limit) || 10;
        //searching
        const search = req.query.search || "";
        //sorting
        const sort=req.query.sort || "latest"; // by default user should see latest post 

        const skip = (page - 1) * limit;
        //can't use [allPost] like this bcz it will return only first index of the array rather than all elements(find()=> selct all post at once )


        //introducing filtering
        const filter ={
            published: true,
            $or:[{title:{$regex:search,$options:"i"}},{content:{$regex:search,$options:"i"}}]
        }

        let sortOptions={}; // using let =>  bcz i have to change its assign value
        if(sort==="latest"){
            sortOptions ={createdAt: -1};
        }

        else if(sort==="oldest"){
            sortOptions={createdAt: 1};
         }

        const  allPost= await postModel.find(filter).sort(sortOptions).skip(skip).limit(limit).populate("author","name email profileImage");  

            //"regex=> Find titles containing search keyword  & "i" = Ignore uppercase/lowercase 
       
// //What populate does
// Instead of only returning: "author":"userId"(eg:dhfqijfuqfqfu42448) => it fetches related user data also.(name:shiv email:shiv@gmail.com)

const totalPost=await postModel.countDocuments(filter);

//totalPost => to calculate total number of pages
const totalPage = Math.ceil(totalPost/limit);

        return res.status(200).json({
            status:true,
            message:"Here are your all the posts Enjoy !!!",
             allPost,
             
            pagination:{
            currentPage:page, 
            totalPage,
            totalPost,
              limit,
            }
        })
    } catch (error) {

        console.error(error);
        return res.status(500).json({
            status:false,
            message:"Internal server error"
        })
        
    } 
};

export const getPostById=async(req,res)=>{
    try {
        const validationResult=await getPostByIdSchema.safeParseAsync(req.params);

        if(!validationResult.success){
            return res.status(400).json({
                status:false,
                message:"Invalid Id"
            });
        }

        const {id} = validationResult.data; // we will write like this {id} bcz zod after validation returns object

        const post = await postModel.findById(id).populate("author","name email profileImage");

        if(!post){
            return res.status(404).json({
                status:false,
                message:"No post has been uploaded !!!"
            })
        }

        if(!post.published){
            let isAuthor = false;
            try {
                const token = req.headers.authorization?.split(" ")[1];
                if(token){
                    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                    if(decoded.id === post.author._id.toString()){
                        isAuthor = true;
                    }
                }
            } catch (err) {
                console.error(err);
                return res.status(400).json({
                    status:false,
                    message:"Invalid Token"
                })
            }

            if(!isAuthor){
                return res.status(403).json({
                    status:false,
                    message:"This post is not published yet!"
                });
            }
        }

        return res.status(200).json({
            status:true,
            message:"Heres your post  !!!",
            post
        })

       
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status:false,
            message:"Internal Server Error"
        })
        
    }
}


export const updatePost=async(req,res)=>{
   try {
     const validationResult=await updatePostIdSchema.safeParseAsync(req.params);

    if(!validationResult.success){
        return res.status(400).json({
            status:false,
            message:"Invalid Id"
        })
    }

    const {id}= validationResult.data;

    const validationData=await updatePostDataSchema.safeParseAsync(req.body);

    if(!validationData.success){
        return res.status(400).json({
            status:false,
            message:"Invalid Data"
        });
    }

    const {title,content} = validationData.data;

    
    const post = await postModel.findById(id);

    if(!post){
        return res.status(404).json({
            status:false,
            message:"Post not found !!!"
        })
    }

    const authorId=post.author.toString(); 
    //post declared upper side=>This line converts the post owner's MongoDB ObjectId into a normal string. ✅

    if(authorId!==req.user.id){
        return res.status(403).json({
            status:false,
            message:"You are not authorized to update the post"
        })
    }

    const updatedPost=await postModel.findByIdAndUpdate(
        id
    ,{
        title,
        content
    },{
        returnDocument: "after"  // return the updated document instead of old one 
    });



    return res.status(200).json({
        status:true,
        message:"Post Updated Successfully",
        updatedPost
    });
    
   } catch (error) {
    console.error(error);
    return res.status(500).json({
        status:false,
        message:"Internal Server Error"
    });
    
   }

};

export const deletePost=async(req,res)=>{
    try {
        const validationResult= await deletePostIdSchema.safeParseAsync(req.params);

        if(!validationResult.success){
            return res.status(400).json(
            {status:false,
                message:"Invalid Id"
            });
        }
        const {id}=validationResult.data;

        const post = await postModel.findById(id);

        if(!post){
            return res.status(404).json({
                status:false,
                message:"Post Not Found"
            })
        }

        if(post.author.toString()!==req.user.id){
            return res.status(403).json({
                status:false,
                message:"You are not authorized to delete this post"
            })
        }

        const oldPublicId=post.coverImage?.public_id;

        if(oldPublicId){
            await cloudinary.uploader.destroy(oldPublicId);
        }

        await postModel.findByIdAndDelete(id);

        return res.status(200).json({
            status:true,
            message:"Post Deleted Successfully",
            
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status:false,
            message:"Internal Server Error"
        });
    }
};

export const myPost=async(req,res)=>{
 try{
     const userId=req.user.id;

     if(!userId){
        return res.status(400).json({
            status:false,
            message:"User not found"
        })
     }

     const post = await postModel.find({author:userId}).populate("author","name email profileImage");

     if(post.length===0){
        return res.status(404).json({
            status:false,
            message:"No posts have been uploaded !!!"
        })
     }

     return res.status(200).json({
        status:true,
        message:"Post found",
        post
     })

 }catch(error){
    console.log(error);
    return res.status(500).json({
        status:false,
        message:"Internal server error"
    })
 }   
};

export const togglePublish=async(req,res)=>{
    try {
        const validationResult=await togglePublishSchema.safeParseAsync(req.params);

        if(!validationResult.success){
            return res.status(400).json({
                status:false,
                message:"Invalid Id"
            })
        };
        const {id}=validationResult.data;

        const post =await postModel.findById(id);

        if(!post){
            return res.status(404).json({
                status:false,
                message:"Post Not Found"
            })
        }

        if(post.author.toString()!=req.user.id){
            return res.status(403).json({
                status:false,
                message:"You are not authorized to toggle publish"
            })
        }

        post.published=!post.published;

        await post.save();

        return res.status(200).json({
            status:true,
            message:post.published?"post published successfully":"post unpublished successfully",
            post
        });
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status:false,
            message:"Internal server error"
        })
    }
};

export const uploadPostCoverImage=async(req,res)=>{
    try {
        if(!req.file){
            return res.status(400).json({
                status:false,
                message:"Image File Is required"
            })
        }
 
        const validationResult=await validatePostIdSchema.safeParseAsync(req.params);

        if(!validationResult.success){
            return res.status(400).json({
                status:false,
                message:"Invalid Post Id"
            })
        }
        const {id}=validationResult.data;

        const post =await postModel.findById(id);

        if(!post){
            return res.status(404).json({
                status:false,
                message:"Post not found "
            })
        }

        if(post.author.toString()!==req.user.id){
            return res.status(403).json({
                status:false,
                message:"User is unauthorized"
            })
        }

        const result=await new Promise ((resolve,reject)=>{

            const stream=cloudinary.uploader.upload_stream(
                {
                    folder:"post-cover-image"
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
        })

        post.coverImage={
            url:result.secure_url,
            public_id:result.public_id
        }
        
        await post.save();


        return res.status(200).json({
            status:true,
            message:"Cover Image uploaded Successfully",
            coverImage:post.coverImage
        })


    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status:false,
            message:"Internal Server Error"
        })
        
    }
};

export const updatedPostCoverImage=async(req,res)=>{
    try {

        if(!req.file){
            return res.status(400).json({
                status:false,
                message:"input file required !"
            })
        }
            const validationResult=await validatePostIdSchema.safeParseAsync(req.params);

            if(!validationResult.success){
                return res.status(400).json({
                    status:false,
                    message:"Enter valid post Id"
                })
            }

            const {id}=validationResult.data;

            const post=await postModel.findById(id);

            if(!post){
                return res.status(404).json({
                    status:false,
                    message:"Post not found"
                })
            }

            if(post.author.toString()!==req.user.id){
                return res.status(403).json({
                    status:false,
                    message:"User is not Authorized"
                })
            }
            
            const result=await new Promise((resolve,reject)=>{

                const stream= cloudinary.uploader.upload_stream(
                    {
                    folder:"post-cover-image"
                },
                (error,result)=>{
                    if(error){
                        reject(error)
                    }else{
                        resolve(result)
                    }
                }
            )

            streamifier.createReadStream(req.file.buffer).pipe(stream);
            })

            const oldPublicId=  post.coverImage?.public_id;

            if(oldPublicId){
                await cloudinary.uploader.destroy(oldPublicId)
            }

            post.coverImage={
                url:result.secure_url,
                public_id:result.public_id
            }

            await post.save();

            return res.status(200).json({
                status:true,
                message:"Cover Image update successfully !",
                coverImage:post.coverImage
            })
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status:false,
            message:"Internal Server Error !"
        })
    }
};

