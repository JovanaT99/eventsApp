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
const searchSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  categoryId: Joi.number().optional(),
  subCategory: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
  peopleCountOrder: Joi.string().valid('asc', 'desc').optional(),
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

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = searchSchema.validate(req.query)
    if (error) {
      throw new HttpBadRequest(error.details[0].message)
    }

    const { name, description, categoryId, subCategory, order, peopleCountOrder } = req.query

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

    const whereConditions = searchConditions.OR.length > 0 ? searchConditions : undefined

    const orderByConditions: any = []

    if (order) {
      orderByConditions.push({
        startAt: order === 'asc' ? 'asc' : 'desc',
      })
    }

    if (peopleCountOrder) {
      orderByConditions.push({
        suggestedPeopleCount: peopleCountOrder === 'asc' ? 'asc' : 'desc',
      })
    }

    const events = await prisma.event.findMany({
      where: whereConditions,
      orderBy: orderByConditions.length > 0 ? orderByConditions : undefined,
    })

    res.status(200).json(events)
  } catch (err) {
    console.error('Error fetching events: ', err)
    next(err)
  }
}

// for postman test

// /events/search?name=Koncert&categoryId=1
// events/search?name=Koncert&categoryId=2&order=asc
// /events/search?name=Koncert&categoryId=1
// /events/search?name=Koncert&categoryId=2&order=asc
// /events/search?peopleCountOrder=asc


