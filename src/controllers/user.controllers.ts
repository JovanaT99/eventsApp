import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

import { HttpValidationError } from '../utils/errors.util';
import prisma from '../utils/prisma';

const userSchema = Joi.object({
  nickname: Joi.string().required(),
  email: Joi.string().email().required(),
  imageUrl: Joi.string().uri().optional(),
  type: Joi.string().required(),
  companyId: Joi.number().optional(),
  reputation: Joi.number().required(),
  phoneNumber: Joi.string().required(),
});

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nickname, email, imageUrl, type, companyId, reputation, phoneNumber } = await userSchema.validateAsync(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new HttpValidationError('User already exists');
    }

    const newUser = await prisma.user.create({
      data: {
        nickname,
        email,
        imageUrl,
        type,
        companyId,
        reputation,
        phoneNumber,
        updatedAt: new Date(),
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user: ", error);
    next(error);
  }
};
