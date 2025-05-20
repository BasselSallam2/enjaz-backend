import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();
import express from "express";
import sgMail from "@sendgrid/mail";
import { number } from "zod";

export const getEmployeesNumber = async (req, res, next) => {
  try {
    let employessCounter = 0;
    const employees = await prisma.employee.findMany({
      where: { isDeleted:false,
        NOT: {
          title: "admin",
        },
      },
      select: { id: true },
    });

    if (!employees) {
      return res.status(404).json({ employessCounter: 0 });
    }
    employessCounter = employees.length;
    return res.status(200).json({ employessCounter: employessCounter });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const getEmployess = async (req, res, next) => {
  try {
    const { department } = req.query;

    if (
      department &&
      department !== "printing" &&
      department !== "translation"
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid department should be printing or translation in query",
        });
    }

    let employees = [];
    if (department) {
      employees = await prisma.employee.findMany({
        where: {
          department: department, isDeleted:false ,
          NOT: {
            title: "admin",
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          Orders: true,
        },
      });
    } else {
      employees = await prisma.employee.findMany({
        where: {isDeleted:false ,
          NOT: {
            title: "admin",
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          Orders: true,
        },
      });
    }
    if (!employees) {
      return res.status(404).json({ message: "No employees found" });
    }

    let mappedEmployees = employees.map((employee) => {
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        ordersNumber: employee.Orders.length,
      };
    });

    res.status(200).json({ employees: mappedEmployees });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const getEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee id is required" });
    }
    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        Orders: {
          select: {
            user: true,
            number: true,
            type: true,
            translationfrom: true,
            translationto: true,
            PrintingDetails: true,
            delivery: true,
            status: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        department: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    let completedOrders = employee.Orders.filter(
      (order) => order.status === "Finished"
    ).length;

    let mappedOrders = employee.Orders.map((order) => {
      return {
        number: order.number,
        client: order.user.name,
        mission: order.type,
        languges: {
          from: order.translationfrom,
          to: order.translationto,
        },
        printingdetials: order.PrintingDetails ? order.PrintingDetails : null,
        delivery: order.delivery,
        date: order.createdAt.toISOString().split("T")[0],
        status: order.status,
        notes: order.notes ? order.notes : null,
      };
    });

    let result = {
      profile: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
      },
      completedOrders: completedOrders,
      missions: mappedOrders,
    };

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
