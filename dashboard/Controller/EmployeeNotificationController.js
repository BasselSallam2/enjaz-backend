import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();





export const getallnotifications = async (req , res , next) => {
    try {
        const {userId} = req.user ;

        const notifitcations = await prisma.employeeNotification.findMany({where:{employeeId:userId} , orderBy:{createdAt:"asc"}}) ;
        if (!notifitcations || notifitcations.length === 0) {
            return res.status(200).json([]);
        }
        
        res.status(200).json(notifitcations);

    }
    catch(error) {
        console.log(error) ;
        next(error) ;
    }
}

export const readEmployeeNotification = async (req , res , next) => {
    try {
        const {notificationId} = req.params ;

        const notification = await prisma.employeeNotification.findUnique({where:{id:notificationId}}) ;

        if(!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const updateNotification = await prisma.employeeNotification.update({where:{id:notificationId} , data:{isRead:true}}) ;

        res.status(200).json({ message: "Notification is marked as read" });

    }
    catch(error) {
        console.log(error) ;
        next(error);
    }
}

export const deleteAllNotifications = async (req , res , next) => {
    try{
        const {userId} = req.user ;
        // await prisma.employeeNotification.deleteMany({where:{employeeId:userId}}) ;
        res.status(200).json({ message: "All notifications deleted successfully" });
    }
    catch(error) {
        console.log(error) ;
        next(error);
    }
}