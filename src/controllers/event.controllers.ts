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

    const categoryExists = await prisma.user.findUnique({
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

// export const getActiveEvents = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const currentDate = new Date()
//     console.log('Current Date:', currentDate)

//     const allEvents = await prisma.event.findMany()
//     console.log('All Events: ', allEvents)

//     //TODO ovo ne bi trebala da filtriras ovde vec iz baze da ti je filtirano
//     //Ali jako pametno, svidja mi se ovaj kod
//     const activeEvents = allEvents.filter((event) => {
//       if (!event.startAt || !event.duration) {
//         console.log('Skipping event due to missing startAt or duration:', event)
//         return false
//       }
//       const endAt = new Date(
//         new Date(event.startAt).getTime() + event.duration * 60 * 60 * 1000
//       )
//       console.log('Event StartAt:', event.startAt)
//       console.log('Event Duration:', event.duration)
//       console.log('Event EndAt:', endAt)
//       return endAt >= currentDate
//     })

//     console.log('Active Events: ', activeEvents)

//     res.status(200).json(activeEvents)
//   } catch (err) {
//     console.error('Error retrieving active events: ', err)
//     next(err)
//   }
// }
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
      //Ovo je problem, jer ako neko unese kategoriju koja ne postoji, npr "abc", categoryCondition ce biti false, i nece uci u ovaj if ispod
      //I onda ce on traziti eventove bez filtera za kategoriju
      //ovo mozes resiti kao sto si resila proveri userId unutar createEvent, tj na pocetku ovog getSearchResult, proveris da li category postoji,
      // ako ne postoji, vratis throw new HttpBadRequest('Category not found');
      //Ali najispravnije resenje jeste da korisnik ne trazi po imenu kategorije vec po categoryId npr 1
    //   if (categoryCondition) {
    //     searchConditions.AND.push({
    //       categoryId: categoryCondition.id,
    //     })
    //   }
    // }

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
