import { model, Schema } from 'mongoose'
import { TSettings } from './settings.interface'

const settingsSchema = new Schema<TSettings>(
  {
    termsConditions: { type: String, required: true },
    aboutUs: { type: String, required: true },
    privacyPolicy: { type: String, required: true },
  },
  { timestamps: true },
)

const Settings = model<TSettings>('Settings', settingsSchema)
export default Settings
