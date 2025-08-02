import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import assetService from "./asset.service";

const createAsset = handleAsyncRequest(async (req: any, res) => {
  const payload = JSON.parse(req?.body?.payload || '{}');
  const result = await assetService.createAsset(req.user.id, payload, req.files);
  successResponse(res, {
    message: "Asset created successfully!",
    data: result,
    status: 201,
  });
});

const getAllAssets = handleAsyncRequest(async (req: any, res) => {
  const result = await assetService.getAllAssets(req.user.id, req.query);
  successResponse(res, {
    message: "Assets retrieved successfully!",
    data: result,
  });
});

const getMyPostedAssets = handleAsyncRequest(async (req: any, res) => {
  const result = await assetService.getMyPostedAssets(req.user.id);
  successResponse(res, {
    message: "My posted assets retrieved successfully!",
    data: result,
  });
});

const getMyGrabbedAssets = handleAsyncRequest(async (req: any, res) => {
  const result = await assetService.getMyGrabbedAssets(req.user.id);
  successResponse(res, {
    message: "My grabbed assets retrieved successfully!",
    data: result,
  });
});

const grabAsset = handleAsyncRequest(async (req: any, res) => {
  const result = await assetService.grabAsset(req.user.id, req.params.id);
  successResponse(res, {
    message: "Asset status changed successfully!",
    data: result,
  });
});

const updateAsset = handleAsyncRequest(async (req: any, res) => {
  const payload = JSON.parse(req?.body?.payload || '{}');
  const result = await assetService.updateAsset(req.params.id, req.user.id, payload, req.files);
  successResponse(res, {
    message: "Asset updated successfully!",
    data: result,
  });
});

const deleteAssetImage = handleAsyncRequest(async (req: any, res) => {
  const result = await assetService.deleteAssetImage(req.params.id, req.user.id, req.body.imageUrl);
  successResponse(res, {
    message: "Asset image deleted successfully!",
    data: result,
  });
});

const deleteAsset = handleAsyncRequest(async (req: any, res) => {
  const result = await assetService.deleteAsset(req.params.id, req.user.id);
  successResponse(res, {
    message: "Asset deleted successfully!",
    data: result,
  });
});

export default {
  createAsset,
  getAllAssets,
  getMyPostedAssets,
  getMyGrabbedAssets,
  grabAsset,
  updateAsset,
  deleteAssetImage,
  deleteAsset,
};