import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

import prisma from '../utils/prisma'

const categorySchema = Joi.object({
  name: Joi.string().required(),
  imageUrl: Joi.string().uri().optional(),
  priority: Joi.number().required(),
  subCategories: Joi.string().required(),
})

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, imageUrl, priority, subCategories } =
      await categorySchema.validateAsync(req.body)

    const newCategory = await prisma.category.create({
      data: {
        name,
        imageUrl,
        priority,
        subCategories,
        updatedAt: new Date(),
      },
    })
    res.status(201).json(newCategory)
  } catch (err) {
    console.error('Error creating category: ', err)
    next(err)
  }
}
