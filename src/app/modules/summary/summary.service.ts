import { ObjectId } from "mongoose";
import { assetStatus, userRoles } from "../../constants/global.constant";
import Asset from "../asset/asset.model";
import Auth from "../auth/auth.model"
import Teacher from "../teacher/teacher.model";
import { startOfYear, endOfYear } from "date-fns";


const getDashboardSummary = async (userId: string, year: number) => {
  const user = await Auth.findById(userId).populate("user");
  const availableAssetQuery = { status: assetStatus.available } as Record<string, any>
  const grabbedAssetQuery = { status: assetStatus.grabbed } as Record<string, any>
  const allAssetQuery = {} as Record<string, any>
  if (user?.role === userRoles.principal) {
    availableAssetQuery.district = ((user?.user as any)?.district as unknown as ObjectId)
    grabbedAssetQuery.district = ((user?.user as any)?.district as unknown as ObjectId)
    allAssetQuery.district = ((user?.user as any)?.district as unknown as ObjectId)
  }
  const availableAssets = await Asset.countDocuments(availableAssetQuery)
  const grabbedAssets = await Asset.countDocuments(grabbedAssetQuery)
  const allAssets = await Asset.countDocuments(allAssetQuery)

  const selectedYear = year || new Date().getFullYear();

  const start = startOfYear(new Date(selectedYear, 0));
  const end = endOfYear(new Date(selectedYear, 0));

  const userSummary = await Teacher.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        users: { $sum: 1 },
      },
    },
    {
      $project: {
        month: "$_id",
        users: 1,
        _id: 0,
      },
    },
  ]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fullSummary = monthNames.map((name, index) => {
    const found = userSummary.find(stat => stat.month === index + 1);
    return {
      month: name,
      users: found ? found.users : 0,
    };
  });



  return { availableAssets, grabbedAssets, allAssets, fullStats: fullSummary }
}

export const summaryServices = { getDashboardSummary }