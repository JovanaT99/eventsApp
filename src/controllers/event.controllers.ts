import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import prisma from "../utils/prisma";

const eventSchema = Joi.object({
  userId: Joi.number().required(),
  categoryId: Joi.number().required(),
  subCategory: Joi.string().required(),
  location: Joi.string().required(),
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  startAt: Joi.date().required(),
  suggestedPeopleCount: Joi.number().required(),
  duration: Joi.number().required(),
  description: Joi.string().required(),
});

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, categoryId, subCategory, location, lat, lng, startAt, suggestedPeopleCount, duration, description } = await eventSchema.validateAsync(req.body);

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const newEvent = await prisma.event.create({
      data: {
        userId,
        categoryId,
        subCategory,
        location,
        lat,
        lng,
        startAt,
        suggestedPeopleCount,
        duration,
        description,
        updatedAt: new Date()
      },
    });
    res.status(201).json(newEvent);
  } catch (err) {
    console.error("Error creating event: ", err);
    next(err);
  }
};

export const getActiveEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentDate = new Date();
    console.log("Current Date:", currentDate);

    const allEvents = await prisma.event.findMany();
    console.log("All Events: ", allEvents);  

    const activeEvents = allEvents.filter(event => {
      if (!event.startAt || !event.duration) {
        console.log("Skipping event due to missing startAt or duration:", event);
        return false;
      }
      const endAt = new Date(new Date(event.startAt).getTime() + event.duration * 60 * 60 * 1000);
      console.log("Event StartAt:", event.startAt);  
      console.log("Event Duration:", event.duration);  
      console.log("Event EndAt:", endAt); 
      return endAt >= currentDate;
    });

    console.log("Active Events: ", activeEvents); 

    res.status(200).json(activeEvents);
  } catch (err) {
    console.error("Error retrieving active events: ", err);
    next(err);
  }
};
