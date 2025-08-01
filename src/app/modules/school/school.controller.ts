import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import schoolService from "./school.service";

const createSchool = handleAsyncRequest(async (req: any, res) => {
  const result = await schoolService.createSchool(req.body);
  successResponse(res, {
    message: "School created successfully!",
    data: result,
    status: 201,
  });
});

const getAllSchools = handleAsyncRequest(async (req, res) => {
  const result = await schoolService.getAllSchools(req.query);
  successResponse(res, {
    message: "Schools retrieved successfully!",
    data: result,
  });
});

const getSchoolById = handleAsyncRequest(async (req, res) => {
  const result = await schoolService.getSchoolById(req.params.id);
  successResponse(res, {
    message: "School retrieved successfully!",
    data: result,
  });
});

const updateSchool = handleAsyncRequest(async (req: any, res) => {
  const result = await schoolService.updateSchool(req.params.id, req.body);
  successResponse(res, {
    message: "School updated successfully!",
    data: result,
  });
});

const deleteSchool = handleAsyncRequest(async (req: any, res) => {
  const id = req.params.id;
  const result = await schoolService.deleteSchool(id);
  successResponse(res, {
    message: "School deleted successfully!",
    data: result,
  });
});

export default {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};