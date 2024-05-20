import { Request, Response } from 'express'
import Joi from 'joi'

import { HttpBadRequest, HttpNotFound } from '../utils/errors.util'
import prisma from '../utils/prisma'