import { TLegal } from './legal.interface'
import Legal from './legal.model'

const getLegalData = async () => {
  const legal = await Legal.find()
  return { Legal: legal[0] }
}

const updateLegalData = async (payload: TLegal) => {
  const result = await Legal.findOneAndUpdate({}, payload, {
    new: true,
    upsert: true
  })
  return result
}

const legalServices = {
  getLegalData,
  updateLegalData,
}

export default legalServices
