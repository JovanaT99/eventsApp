import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import prisma from "src/utils/prisma";

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
      },
    });

    res.status(201).json(newEvent);
  } catch (err) {
    console.error("Error creating event: ", err);
    next(err);
  }
};
