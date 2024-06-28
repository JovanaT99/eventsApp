import { Request, Response, NextFunction } from 'express'
import * as geolib from 'geolib'
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
  content: Joi.string().optional(),
  categoryId: Joi.number().optional(),
  subcategory: Joi.string().optional(),
  order: Joi.string()
    .valid('peopleLeast', 'peopleMost', 'startingSoon', 'startingLast')
    .optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  radius: Joi.number().optional(), // km
})

const eventMessageSchema = Joi.object({
  eventId: Joi.number().required(),
  userId: Joi.number().required(),
  content: Joi.string().required(),
  attendenceOnly: Joi.boolean().required(),
})
const eventAttendaceShema = Joi.object({
  eventId: Joi.number().required(),
  userId: Joi.number().required(),
  status: Joi.string().valid('attending', 'notAttending').required(),
  attendanceAt: Joi.date().optional(),
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

    console.log('Validacija', req.body)

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
      },
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
          gt: currentDate,
        },
        duration: {
          gt: 0,
        },
      },
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
    const { content, categoryId, subcategory, order, lat, lng, radius } =
      await searchSchema.validateAsync(req.query)

    const searchConditions: any = {
    }


    if (content) {
      searchConditions.OR = []

      searchConditions.OR.push(
        { name: { contains: content as string, mode: 'insensitive' } },
        { description: { contains: content as string, mode: 'insensitive' } }
      )
    }

    if (categoryId) {
      searchConditions.categoryId = parseInt(categoryId as string)
    }

    if (subcategory) {
      searchConditions.subCategory = {
        contains: subcategory as string,
        mode: 'insensitive',
      }
    }

    const orderByConditions: any = []

    if (order === 'peopleLeast') {
      orderByConditions.push({ suggestedPeopleCount: 'asc' })
    } else if (order === 'peopleMost') {
      orderByConditions.push({ suggestedPeopleCount: 'desc' })
    } else if (order === 'startingSoon') {
      orderByConditions.push({ startAt: 'asc' })
    } else if (order === 'startingLast') {
      orderByConditions.push({ startAt: 'desc' })
    }

    let events = await prisma.event.findMany({
      where: searchConditions,
      orderBy: orderByConditions.length > 0 ? orderByConditions : undefined,
    })

    if (lat && lng && radius) {
      const latitude = parseFloat(lat as string)
      const longitude = parseFloat(lng as string)
      const distanceRadius = parseFloat(radius as string) * 1000 // convert radius to meters

      events = events.filter((event) => {
        const distance = geolib.getDistance(
          { latitude: event.lat, longitude: event.lng },
          { latitude, longitude }
        )
        console.log(`Event ID: ${event.id}, Distance: ${distance} meters`)
        return distance <= distanceRadius
      })
    }

    res.status(200).json(events)
  } catch (err) {
    console.error('Error fetching events: ', err)
    next(err)
  }
}

export const getEventsInDB = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = searchSchema.validate(req.query)
    if (error) {
      throw new HttpBadRequest(error.details[0].message)
    }

    const { lat, lng, radius } =
      req.query

    

    const distanceRadius = parseFloat(radius as string) * 1000 // convert radius to meters

    let events: any = await prisma.$queryRaw`SELECT * from public."Event"
    WHERE ST_DWithin(
                st_setsrid(st_makepoint(lat, lng), 4326)::geography,
                st_setsrid(st_makepoint(${Number(lat)}, ${Number(lng)}), 4326)::geography,
                ${Number(distanceRadius)}
            )`

    console.log('here0', events.length)

    res.status(200).json(events)
  } catch (err) {
    console.error('Error fetching events: ', err)
    next(err)
  }
}

export const addEventMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId, userId, content, attendenceOnly } =
      await eventMessageSchema.validateAsync(req.body)

    const [eventExists, userExists] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ])

    if (!eventExists) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' })
    }

    const newMessage = await prisma.eventMessage.create({
      data: {
        content,
        attendenceOnly,
        event: {
          connect: { id: eventId },
        },
        user: {
          connect: { id: userId },
        },
      },
    })

    res.status(201).json(newMessage)
  } catch (err) {
    console.error('Error event message, err')
    next(err)
  }
}

export const markEventAttendace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
      try {
        const { eventId, userId, status, attendanceAt } =
          await eventAttendaceShema.validateAsync(req.body)

    const attendance = await prisma.eventAttendance.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      update: {
        status,
        attendanceAt: attendanceAt ? new Date(attendanceAt) : new Date(),
      },
      create: {
        eventId,
        userId,
        status,
        attendanceAt: attendanceAt ? new Date(attendanceAt) : new Date(),
      },
    })

    res.status(200).json(attendance)
  } catch (err) {
    console.error('Error event attendance: ', err)
    next(err)
  }
}
