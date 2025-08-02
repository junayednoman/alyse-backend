import handleAsyncRequest from '../../utils/handleAsyncRequest'
import { successResponse } from '../../utils/successResponse'
import legalServices from './legal.service'

const getLegalData = handleAsyncRequest(async (req, res) => {
  const result = await legalServices.getLegalData()
  successResponse(res, {
    message: 'Legal data retrieved successfully!',
    data: result?.Legal,
  })
})

const updateLegalData = handleAsyncRequest(async (req, res) => {
  const payload = req.body
  const result = await legalServices.updateLegalData(payload)
  successResponse(res, {
    message: 'Legal data updated successfully!',
    data: result,
  })
})

const LegalController = {
  getLegalData,
  updateLegalData,
}

export default LegalController
