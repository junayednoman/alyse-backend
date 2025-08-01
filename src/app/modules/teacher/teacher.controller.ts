import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import teacherService from "./teacher.service";

const teacherSignup = handleAsyncRequest(async (req: any, res) => {
  const payload = JSON.parse(req?.body?.payload || '{}');
  const result = await teacherService.teacherSignup(payload, req.file);
  successResponse(res, {
    message: "Teacher signed up successfully!",
    data: result,
    status: 201,
  });
});

const getAllTeachers = handleAsyncRequest(async (req: any, res) => {
  const result = await teacherService.getAllTeachers(req.query);
  successResponse(res, {
    message: "Teachers retrieved successfully!",
    data: result,
  });
});

const getTeachersByDistrictId = handleAsyncRequest(async (req: any, res) => {
  const result = await teacherService.getTeachersByDistrictId(req.params.districtId, req.query);
  successResponse(res, {
    message: "Teachers retrieved by district successfully!",
    data: result,
  });
});

const getTeacherProfile = handleAsyncRequest(async (req: any, res) => {
  const result = await teacherService.getTeacherProfile(req.user.email);
  successResponse(res, {
    message: "Teacher profile retrieved successfully!",
    data: result,
  });
});

const updateTeacherProfile = handleAsyncRequest(async (req: any, res) => {
  const result = await teacherService.updateTeacherProfile(req.user.email, req.body);
  successResponse(res, {
    message: "Teacher profile updated successfully!",
    data: result,
  });
});

const updateTeacherProfileImage = handleAsyncRequest(async (req: any, res) => {
  const result = await teacherService.updateTeacherProfileImage(req.user.email, req.file);
  successResponse(res, {
    message: "Teacher profile image updated successfully!",
    data: result,
  });
});

export default {
  teacherSignup,
  getAllTeachers,
  getTeachersByDistrictId,
  getTeacherProfile,
  updateTeacherProfile,
  updateTeacherProfileImage,
};