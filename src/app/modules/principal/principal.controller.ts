import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import principalService from "./principal.service";

const addPrincipal = handleAsyncRequest(async (req: any, res) => {
  const result = await principalService.addPrincipal(req.body);
  successResponse(res, {
    message: "Principal added successfully!",
    data: result,
    status: 201,
  });
});

const getAllPrincipals = handleAsyncRequest(async (req: any, res) => {
  const result = await principalService.getAllPrincipals(req.query);
  successResponse(res, {
    message: "Principals retrieved successfully!",
    data: result,
  });
});

const getPrincipalProfile = handleAsyncRequest(async (req: any, res) => {
  const result = await principalService.getPrincipalProfile(req.user.email);
  successResponse(res, {
    message: "Principal profile retrieved successfully!",
    data: result,
  });
});

const getPrincipalById = handleAsyncRequest(async (req: any, res) => {
  const result = await principalService.getPrincipalById(req.params.id);
  successResponse(res, {
    message: "Principal retrieved successfully!",
    data: result,
  });
});

const updatePrincipalProfile = handleAsyncRequest(async (req: any, res) => {
  const result = await principalService.updatePrincipalProfile(req.user.email, req.body);
  successResponse(res, {
    message: "Principal profile updated successfully!",
    data: result,
  });
});

const updatePrincipalImage = handleAsyncRequest(async (req: any, res) => {
  const result = await principalService.updatePrincipalImage(req.user.email, req.file);
  successResponse(res, {
    message: "Principal profile image updated successfully!",
    data: result,
  });
});

const changePrincipalStatus = handleAsyncRequest(async (req: any, res) => {
  const result = await principalService.changePrincipalStatus(req.params.id);
  successResponse(res, {
    message: "Principal status changed successfully!",
    data: result,
  });
});

export default {
  addPrincipal,
  getAllPrincipals,
  getPrincipalProfile,
  getPrincipalById,
  updatePrincipalProfile,
  updatePrincipalImage,
  changePrincipalStatus,
};