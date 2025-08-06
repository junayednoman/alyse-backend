import handleAsyncRequest from "../../utils/handleAsyncRequest";
import { successResponse } from "../../utils/successResponse";
import messageService from "./message.service";

const createMessage = handleAsyncRequest(async (req: any, res) => {
  const payload = req.body;
  payload.sender = req.user.id;
  const result = await messageService.createMessage(payload);
  successResponse(res, {
    message: "Message created successfully!",
    data: result,
    status: 201,
  });
});

const getMessagesByChatId = handleAsyncRequest(async (req: any, res) => {
  req.query.chat = req.params.chatId;
  const result = await messageService.getMessagesByChatId(req.query);
  successResponse(res, {
    message: "Messages retrieved successfully!",
    data: result,
  });
});

const updateMessage = handleAsyncRequest(async (req: any, res) => {
  const result = await messageService.updateMessage(req.params.id, req.user.id, req.body);
  successResponse(res, {
    message: "Message updated successfully!",
    data: result,
  });
});

const markMessagesAsSeen = handleAsyncRequest(async (req: any, res) => {
  const result = await messageService.markMessagesAsSeen(req.params.chatId, req.user.id);
  successResponse(res, {
    message: "Messages marked as seen successfully!",
    data: result,
  });
});

const deleteMessage = handleAsyncRequest(async (req: any, res) => {
  const result = await messageService.deleteMessage(req.params.id, req.user.id);
  successResponse(res, {
    message: "Message deleted successfully!",
    data: result,
  });
});

export default {
  createMessage,
  getMessagesByChatId,
  updateMessage,
  markMessagesAsSeen,
  deleteMessage,
};