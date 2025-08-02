import { Router } from 'express'
import LegalController from './legal.controller'
import authVerify from '../../middlewares/authVerify'
import { updateLegalSchema } from './legal.validation'
import { handleZodValidation } from '../../middlewares/handleZodValidation'
import { userRoles } from '../../constants/global.constant'

export const legalRoutes = Router()

legalRoutes.get('/', LegalController.getLegalData)
legalRoutes.put(
  '/',
  authVerify([userRoles.admin]),
  handleZodValidation(updateLegalSchema),
  LegalController.updateLegalData,
)
