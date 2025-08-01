import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import districtServices from "./district.service";

const createDistrict = handleAsyncRequest(async (req: any, res) => {
  const payload = JSON.parse(req?.body?.payload || '{}');
  const result = await districtServices.createDistrict(payload, req?.file)
  successResponse((res), {
    message: "District created successfully!",
    status: 201,
    data: result
  })
})

const getDistricts = handleAsyncRequest(async (req: any, res) => {
  const result = await districtServices.getDistricts(req.query)
  successResponse((res), {
    message: "District retrieved successfully!",
    data: result
  })
})

const updateDistrict = handleAsyncRequest(async (req: any, res) => {
  const id = req?.params.id
  const payload = JSON.parse(req?.body?.payload || '{}');

  const result = await districtServices.updateDistrict(id, payload, req?.file)
  successResponse((res), {
    message: "District updated successfully!",
    data: result
  })
})

const deleteDistrict = handleAsyncRequest(async (req: any, res) => {
  const result = await districtServices.deleteDistrict(req.params.id)
  successResponse((res), {
    message: "District deleted successfully!",
    data: result
  })
})

const districtController = {
  createDistrict,
  getDistricts,
  updateDistrict,
  deleteDistrict
}

export default districtController;