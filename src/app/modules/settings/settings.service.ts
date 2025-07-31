import { TSettings } from './settings.interface'
import Settings from './settings.model'

const getSettingsData = async () => {
  const settings = await Settings.find()
  return { settings: settings[0] }
}

const updateSettingsData = async (payload: TSettings) => {

  const result = await Settings.findOneAndUpdate({}, payload, {
    new: true,
    upsert: true
  })
  return result
}

const settngsServices = {
  getSettingsData,
  updateSettingsData,
}

export default settngsServices
