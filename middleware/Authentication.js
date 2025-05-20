import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import "dotenv/config";
import jwt from "jsonwebtoken";

export const authenticateUser = async (req, res, next) => {
  let token = req.cookies.token || req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.uid && decoded.uid.length > 0) {
      const user = await prisma.user.findUnique({
        where: { uid: decoded.uid },
      });

      if (!user) {
        
        const isregistered = await prisma.user.findUnique({
          where: { email: decoded.email },
        });

        if (isregistered) {
          return res
            .status(401)
            .json({
              message: " User already registered with different provider",
            });
        }

        const newuser = await prisma.user.create({
          data: {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name,
            
          },
        });

        decoded = {
          userId: newuser.id,
          username: newuser.name,
          email: newuser.email,
        };
      }else {
        decoded = {
          userId: user.id,
          username: user.name,
          email: user.email,
        };
      }
    }

    
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
