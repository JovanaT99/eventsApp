import axios from 'axios'
import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

import { HttpBadRequest, HttpValidationError } from '../utils/errors.util'
import prisma from '../utils/prisma'

const userSchema = Joi.object({
  nickname: Joi.string().required(),
  email: Joi.string().email().required(),
  imageUrl: Joi.string().uri().optional(),
  type: Joi.string().required(),
  companyId: Joi.number().optional(),
  reputation: Joi.number().required(),
  phoneNumber: Joi.string().required(),
})

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      nickname,
      email,
      imageUrl,
      type,
      companyId,
      reputation,
      phoneNumber,
    } = await userSchema.validateAsync(req.body)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new HttpValidationError('User already exists')
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
    })

    res.status(201).json(newUser)
  } catch (error) {
    console.error('Error creating user: ', error)
    next(error)
  }
}

export const google = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query

    let profile = null

    try {
      // Exchange authorization code for access token
      const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        client_id:
          process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: 'http://localhost:3000/auth/google',
        grant_type: 'authorization_code',
      })

      const { access_token, id_token } = data

      // Use access_token or id_token to fetch user profile
      const { data: _profile } = await axios.get(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      )

      profile = _profile
    } catch (e) {
      console.error(e)
    }

    if (!profile) {
      throw new HttpBadRequest('Failed to get Google data')
    }

    // Code to handle user authentication and retrieval using the profile data

    const existingUser = await prisma.user.findUnique({
      where: { email: profile.email },
    })

    if (existingUser) {
      res.status(200).json(existingUser)
    }

    const newUser = await prisma.user.create({
      data: {
        nickname: profile.name,
        email: profile.email,
        imageUrl: profile.picture,
        type: 'user',
        companyId: null,
        reputation: 0,
        phoneNumber: '',
        updatedAt: new Date(),
      },
    })

    res.status(201).json(newUser)
  } catch (error) {
    console.error('Error creating user: ', error)
    next(error)
  }
}
