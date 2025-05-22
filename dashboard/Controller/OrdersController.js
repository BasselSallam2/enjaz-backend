import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import dotenv from "dotenv";
dotenv.config();
import { sendNotification } from "../../util/services/ordersNotification.js";
import archiver from "archiver"
import path from "path"
import fs from "fs"


export const ordersStatistics = async (req, res , next) => {
    try {
        const {employeeId} = req.user ;
        let ordersCounter = 0 ;
        let CanclledOrdersCounter = 0 ;
        let newOrdersCounter = 0 ;
        let completedOrdersCounter = 0 ;
        let inProgressOrdersCounter = 0 ;

        const orders = await prisma.orders.findMany({
            where : {
                employeeId : employeeId, isDeleted:false
            },
            select:{createdAt:true , status:true}
            },
        );

        if(!orders || orders.length === 0) {
            return res.status(401).json({error : "No orders found"})
        }

        ordersCounter = orders.length ;
      


        const mappedorders = orders.map((order) => {
            if(order.status === "Cancelled") {
                CanclledOrdersCounter++ ;
            }else if(order.status === "Finished") {
                completedOrdersCounter++ ;
            }else if(order.status !== "Cancelled" && order.status !== "Finished" && order.createdAt.getTime() > new Date(Date.now() - 24 * 60 * 60 * 1000).getTime()) {
                newOrdersCounter++ ;
            }else if(order.status !== "Cancelled" && order.status !== "Finished" && order.createdAt.getTime() < new Date(Date.now() - 24 * 60 * 60 * 1000).getTime()) {
                inProgressOrdersCounter++ ;
            }
        });
      

        const result = {
            cancelledorders: parseFloat((CanclledOrdersCounter / ordersCounter * 100).toFixed(2)),
            neworders: parseFloat((newOrdersCounter / ordersCounter * 100).toFixed(2)),
            completedorders: parseFloat((completedOrdersCounter / ordersCounter * 100).toFixed(2)),
            inprogressorders: parseFloat((inProgressOrdersCounter / ordersCounter * 100).toFixed(2)),
        }
        res.status(200).json(result);
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

export const ordersRate = async (req, res , next) => {
    try{
        const {employeeId} = req.user ;

        let ordersCounter = 0 ;
        let translationCounter = 0 ;
        let printingCounter = 0 ;
        let lateOrdersCounter = 0 ;

        const orders = await prisma.orders.findMany({
            where : {
                employeeId : employeeId,
            },
            select:{createdAt:true , status:true , type:true}
        });
        ordersCounter = orders.length ;
        

        const mappedorders = orders.map((order) => {
            
            if(order.type === "translation") {
                translationCounter++ ;
            }else if(order.type === "printing") {
                printingCounter++ ;
            }
                if (order.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000 < new Date(Date.now()).getTime() && order.status !== "Cancelled" && order.status !== "Finished") {
                lateOrdersCounter++ ;   
            }
            
        });

        const result = {
            translationpercentage: parseFloat((translationCounter / ordersCounter * 100).toFixed(2)),
            printingpercentage: parseFloat((printingCounter / ordersCounter * 100).toFixed(2)),
            lateorderspercentage: parseFloat((lateOrdersCounter / ordersCounter * 100).toFixed(2)),
        }
        res.status(200).json(result);
    }
    catch(error) {
        console.log(error);
        next(error);
    }

}

export const currentOrders = async (req, res , next) => {
    try{
        let {employeeId , title} = req.user ;
        let {type , status} = req.query ;
        let orders ;
        type = type.trim().toLowerCase();
        status = status.trim().toLowerCase().replace(/\s+/g, '');
        console.log(title) ;
        if(!type || !status) {
            return res.status(401).json({error : "Please provide type and status query parameters"});
        }

        if(type !== "translation" && type !== "printing") {
            return res.status(401).json({error : "type query must be either translation or printing"});
        }
        if(status !== "new" && status !== "cancelled" && status !== "finished" && status !== "inprogress") {
            return res.status(401).json({error : "status query must be either cancelled or finished or inprogress or new"});
        }
           if(status === "finished") {
            orders = await prisma.orders.findMany({
                where : {
                    ...(title !== "admin" && title !== "superadmin" && { employeeId: employeeId }),
                    type : type,
                    status : "Finished",isDeleted:false
                },
                select:{number:true, user:true , numberofletters:true , cost:true ,createdAt:true , status:true , type:true , PrintingDetails:true , Employee:true},
                orderBy:{createdAt: "desc"}
            });
        }else if(status === "cancelled") {
            orders = await prisma.orders.findMany({
                where : {
                    ...(title !== "admin" && title !== "superadmin" && { employeeId: employeeId }),
                    type : type,
                    status : "Cancelled",isDeleted:false
                },
                select:{number:true, user:true , numberofletters:true , cost:true ,createdAt:true , status:true , type:true , PrintingDetails:true , Employee:true}
            });
        }else if(status === "inprogress") {
            orders = await prisma.orders.findMany({
                where : {
                    ...(title !== "admin" && title !== "superadmin" && { employeeId: employeeId }),isDeleted:false ,
                    type : type, 
                    status : {
                        notIn: ["Cancelled", "Finished"],
                    },
                },
                select:{number:true, user:true , numberofletters:true , cost:true ,createdAt:true , status:true , type:true,PrintingDetails:true , Employee:true},
                orderBy:{createdAt: "desc"}
            });
        }else if(status === "new") {
            orders = await prisma.orders.findMany({
                where : {
                    ...(title !== "admin" && title !== "superadmin" && { employeeId: employeeId }), isDeleted:false ,
                },
                select:{number:true, user:true , numberofletters:true , cost:true ,createdAt:true , status:true , type:true , PrintingDetails:true , Employee:true},
                orderBy:{createdAt: "desc"}
            });

            orders = orders.filter((order) => {
                return order.createdAt.getTime() > new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).getTime() && order.status !== "Cancelled" && order.status !== "Finished" ;
            });
        }
        if(!orders || orders.length === 0) {
            return res.status(200).json([]) ;
        }

    

        let mappedorders = orders.map((order) => {
            if(order.type === "translation") {
            return {
                number: order.number,
                user: order.user.name ,
                numberofletters: order.numberofletters,
                status: order.status,
                createdAt: order.createdAt.toISOString(),
                cost: order.cost,
                employeeId:order.Employee ? order.Employee.id : null ,
                employeename:order.Employee ? order.Employee.name : null ,

            }
        }else if(order.type === "printing") {
            return {
                number: order.number,
                user: order.user.name ,
                details: order.PrintingDetails ,
                status: order.status,
                createdAt: order.createdAt.toISOString(),
                cost: order.cost,
                employeeId:order.Employee ? order.Employee.id : null ,
                employeename:order.Employee ? order.Employee.name : null ,
            }
        }
        });

        res.status(200).json(mappedorders);


        

    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

export const updateOrder = async (req, res, next) => {
    try {
        console.log("====== Incoming Request ======");
        console.log("req.params:", req.params);
        console.log("req.body:", req.body);

        let { orderId } = req.params;
        let { numberofletters, status, cost } = req.body;

        let allowedStatuses = ["Under Review", "Offer Sent", "In Progress", "In delivery", "Finished", "Cancelled"];

        cost = parseFloat(cost);
        numberofletters = parseInt(numberofletters);
        orderId = parseInt(orderId);

        console.log("Parsed Values =>", {
            orderId,
            numberofletters,
            cost,
            status
        });

        if (status && !allowedStatuses.includes(status)) {
            console.log("❌ Invalid status:", status);
            return res.status(401).json({
                error: "status must be one of the following: Under Review, Offer Sent, In Progress, In delivery, Finished, Cancelled"
            });
        }

        const order = await prisma.orders.findUnique({
            where: {
                number: orderId,
            },
            select: {
                numberofletters: true,
                cost: true,
                status: true,
                user: true
            }
        });

        if (!order) {
            console.log("❌ No order found with number:", orderId);
            return res.status(401).json({ error: "No order found" });
        }

        console.log("✅ Existing Order Found:", order);

        const updatedOrder = await prisma.orders.update({
            where: {
                number: orderId,
            },
            data: {
                numberofletters: numberofletters,
                cost: cost,
                status: status
            },
        });

        console.log("✅ Order Updated:", updatedOrder);

        let fireBaseToken = order.user.mobileToken;
        let title = `Order ${orderId} Status Updated`;
        let body = `${status}`;
        let data = {
            orderId: `${orderId}`,
            status: status,
        };

        console.log("📲 Sending Notification:", { fireBaseToken, title, body, data });

        await sendNotification(fireBaseToken, title, body, data);

        await prisma.coustmerNotification.create({
            data: {
                userid: order.user.id,
                title: title,
                body: body,
                type: "Order Status Changed",
                serviceId: orderId.toString()
            }
        });

        console.log("🔔 Notification Saved to DB");

        res.status(200).json({
            message: "Order updated successfully",
            order: updatedOrder
        });

    } catch (error) {
        console.log("🔥 Error in updateOrder:", error);
        next(error);
    }
}

export const getOrder = async (req, res , next) => {
    try{
        let {orderId} = req.params ;
        orderId = parseInt(orderId) ;
        const order = await prisma.orders.findUnique({
            where : {
                number : orderId,
            },
            select:{number:true, user:true , numberofletters:true , cost:true ,createdAt:true , status:true , type:true , delivery:true , address: true , Employee:true , PrintingDetails:true}
        });

        if(!order) {
            return res.status(401).json({error : "No order found"})
        }
        
        let result = {} ;
        if(order.type === "translation") {
         result = {
            summary : {
                number: order.number,
                client: order.user.name ,
                date: order.createdAt.toISOString(),
                status: order.status,
                cost: order.cost,
            } ,
            client: {
                name: order.user.name,
                email: order.user.email,
                phone: order.user.phone,
                address: order.address ? order.address : order.delivery,
            },
            order_details :{
                number: order.number,
                type: order.type,
                numberofletters: order.numberofletters,
                status: order.status,
                cost: order.cost,
                delivery: order.delivery,
                employee: order.Employee.name,

            }
        }
    }else if(order.type === "printing") {
         result = {
            summary : {
                number: order.number,
                client: order.user.name ,
                date: order.createdAt.toISOString(),
                status: order.status,
                cost: order.cost,
            } ,
            client: {
                name: order.user.name,
                email: order.user.email,
                phone: order.user.phone,
                address: order.address ? order.address : order.delivery,
            },
            order_details :{
                number: order.number,
                type: order.type,
                details: order.PrintingDetails,
                status: order.status,
                cost: order.cost,
                delivery: order.delivery,
                employee: order.Employee.name,

            }
        }
    }

        res.status(200).json(result);

    }
    catch(error) {
        console.log(error);
        next(error);
    }

}


export const downloadOrders = async (req , res , next) => {
    try{
         let {orderId} = req.params ;
         orderId = parseInt(orderId) ;
         let files = [] ;

         const order = await prisma.orders.findUnique({where:{number:orderId} , include:{PrintingDetails:true}}) ;

         if(!order) {
            return res.status(404).json({message:"order is not found"}) ;
         }
         if(order.type === "translation") {
            files = order.files ;
         }else if(order.type === "printing") {
            const mapper = order.PrintingDetails.forEach((detail) => {
                files.push(detail.file) ;
            })
         }

         const archive = archiver('zip', { zlib: { level: 9 } });
         res.attachment('test_files.zip');
         archive.pipe(res);
 
         files.forEach(file => {
             const filePath = path.join(process.cwd(), 'public', 'files', file);
             if (fs.existsSync(filePath)) {
                 archive.file(filePath, { name: file });
             } else {
                 console.warn(`File not found: ${filePath}`);
             }
         });
 
         await archive.finalize();
    }
    catch(error) {
        console.log(error) ;
        next(error) ;
    }
}