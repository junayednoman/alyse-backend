import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import chatService from "./chat.service";

const createChat = handleAsyncRequest(async (req: any, res) => {
  const result = await chatService.createChat(req.user.id, req.body);
  successResponse(res, {
    message: "Chat created successfully!",
    data: result,
    status: 201,
  });
});

const getMyChats = handleAsyncRequest(async (req: any, res) => {
  const result = await chatService.getMyChats(req.user.id, req.query.limit);
  successResponse(res, {
    message: "My chats retrieved successfully!",
    data: result,
  });
});

const deleteChat = handleAsyncRequest(async (req: any, res) => {
  const result = await chatService.deleteChat(req.params.id, req.user.id);
  successResponse(res, {
    message: "Chat deleted successfully!",
    data: result,
  });
});

export default {
  createChat,
  getMyChats,
  deleteChat,
};