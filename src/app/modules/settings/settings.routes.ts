import { Router } from 'express'
import settingsController from './settings.controller'
import authVerify from '../../middlewares/authVerify'
import { updateSettingsSchema } from './settings.validation'
import { handleZodValidation } from '../../middlewares/handleZodValidation'
import { userRoles } from '../../constants/global.constant'

export const settingsRoutes = Router()

settingsRoutes.get('/', authVerify([userRoles.admin, userRoles.companyAdmin, userRoles.employee]), settingsController.getSettingsData)
settingsRoutes.put(
  '/',
  authVerify([userRoles.admin]),
  handleZodValidation(updateSettingsSchema),
  settingsController.updateSettingsData,
)
