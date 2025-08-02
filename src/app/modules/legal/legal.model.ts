import { model, Schema } from 'mongoose'
import { TLegal } from './legal.interface'

const legalSchema = new Schema<TLegal>(
  {
    termsConditions: { type: String, required: true },
    aboutUs: { type: String, required: true },
    privacyPolicy: { type: String, required: true },
  },
  { timestamps: true },
)

const Legal = model<TLegal>('Legal', legalSchema)
export default Legal
