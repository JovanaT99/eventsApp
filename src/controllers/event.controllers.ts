import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

import { HttpBadRequest } from '../utils/errors.util'
import prisma from '../utils/prisma'

const eventSchema = Joi.object({
  userId: Joi.number().required(),
  categoryId: Joi.number().required(),
  name: Joi.string().required(),
  subCategory: Joi.string().required(),
  location: Joi.string().required(),
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  startAt: Joi.date().required(),
  suggestedPeopleCount: Joi.number().required(),
  duration: Joi.number().required(),
  description: Joi.string().required(),
})

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      userId,
      categoryId,
      name,
      subCategory,
      location,
      lat,
      lng,
      startAt,
      suggestedPeopleCount,
      duration,
      description,
    } = await eventSchema.validateAsync(req.body)

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userExists) {
      throw new HttpBadRequest('User not found')
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!categoryExists) {
      throw new HttpBadRequest('Category not found')
    }

    const newEvent = await prisma.event.create({
      data: {
        userId,
        categoryId,
        name,
        subCategory,
        location,
        lat,
        lng,
        startAt,
        suggestedPeopleCount,
        duration,
        description,
      } ,
    })
    res.status(201).json(newEvent)
  } catch (err) {
    console.error('Error creating event: ', err)
    next(err)
  }
}

export const getActiveEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentDate = new Date()
    console.log('Trenutni datum:', currentDate)

    const activeEvents = await prisma.event.findMany({
      where: {
        startAt: {
          gt: currentDate    
        },
        duration: {
          gt: 0
        }
      }
    })

    console.log('Active Event: ', activeEvents)

    res.status(200).json(activeEvents)
  } catch (err) {
    console.error('Error: ', err)
    next(err)
  }
}
export const getSearchResult = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, categoryId, subCategory } = req.query
    const searchConditions: any = {
      OR: [],
    }

    if (name) {
      const nameWords = (name as string).split(' ').map((word) => ({
        name: {
          contains: word,
          mode: 'insensitive',
        },
      }))
      searchConditions.OR.push(...nameWords)
    }

    if (description) {
      searchConditions.OR.push({
        description: {
          contains: description as string,
          mode: 'insensitive',
        },
      })
    }

    if (categoryId) {
      searchConditions.OR.push({
        categoryId: parseInt(categoryId as string),
      })
    }

    if (subCategory) {
      searchConditions.OR.push({
        subCategory: {
          contains: subCategory as string,
          mode: 'insensitive',
        },
      })
    }

    const whereConditions =
      searchConditions.OR.length > 0 ? searchConditions : undefined

    const events = await prisma.event.findMany({
      where: whereConditions,
    })

    res.status(200).json(events)
  } catch (err) {
    console.error('Error searching for events: ', err)
    next(err)
  }
}

export const getSortResult = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sortOrder = req.query.order === 'asc' ? 'asc' : 'desc';

    const events = await prisma.event.findMany({
      orderBy: {
        startAt: sortOrder,
      },
    });

    res.status(200).json(events);
  } catch (err) {
    console.error('Error sorting events: ', err);
    next(err);
  }
};