import { model, Schema } from 'mongoose'
import { TSettings } from './settings.interface'

const settingsSchema = new Schema<TSettings>(
  {
    terms_conditions: { type: String, required: true },
    about_us: { type: String, required: true },
    privacy_policy: { type: String, required: true },
  },
  { timestamps: true },
)

const Settings = model<TSettings>('Settings', settingsSchema)
export default Settings
