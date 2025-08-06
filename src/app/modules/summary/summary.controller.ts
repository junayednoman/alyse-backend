import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import { summaryServices } from "./summary.service";

const getDashboardSummary = handleAsyncRequest(async (req: any, res) => {
  const result = await summaryServices.getDashboardSummary(req.user.id, req.query.year);
  successResponse(res, {
    message: "Dashboard summary retrieved successfully!",
    data: result,
  });
});

export const summaryController = { getDashboardSummary };