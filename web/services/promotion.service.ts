import api from "@/lib/axios";
import type {
  EventPromotionsResponse,
  GetPromotionsParams,
  PromotionFormData,
  PromotionQuoteResponse,
  PromotionResponse,
  PromotionsResponse,
  PromotionStatus,
} from "@/types/promotion";

const normalizePayload = (data: PromotionFormData) => {
  const payload: PromotionFormData = {
    ...data,
    code:
      data.promotionMode === "coupon" && data.code
        ? data.code.trim().toUpperCase()
        : undefined,
    description: data.description?.trim() || undefined,
    displayText: data.displayText?.trim() || undefined,
  };

  if (payload.promotionMode === "automatic") {
    delete payload.code;
  }

  if (payload.discountType === "fixed") {
    delete payload.maximumDiscountAmount;
  }

  return payload;
};

export const createPromotion = async (
  data: PromotionFormData
): Promise<PromotionResponse> => {
  const response = await api.post(
    "/promotions",
    normalizePayload(data)
  );

  return response.data;
};

export const getPromotions = async (
  params: GetPromotionsParams = {}
): Promise<PromotionsResponse> => {
  const response = await api.get("/promotions", {
    params,
  });

  return response.data;
};

export const getPromotionById = async (
  id: string
): Promise<PromotionResponse> => {
  const response = await api.get(`/promotions/${id}`);

  return response.data;
};

export const updatePromotion = async (
  id: string,
  data: PromotionFormData
): Promise<PromotionResponse> => {
  const response = await api.put(
    `/promotions/${id}`,
    normalizePayload(data)
  );

  return response.data;
};

export const updatePromotionStatus = async (
  id: string,
  status: PromotionStatus
): Promise<PromotionResponse> => {
  const response = await api.patch(
    `/promotions/${id}/status`,
    {
      status,
    }
  );

  return response.data;
};

export const deletePromotion = async (
  id: string
): Promise<PromotionResponse> => {
  const response = await api.delete(`/promotions/${id}`);

  return response.data;
};

export const quotePromotion = async (data: {
  eventId: string;
  ticketCount: number;
  couponCode?: string;
}): Promise<PromotionQuoteResponse> => {
  const response = await api.post("/promotions/quote", {
    eventId: data.eventId,
    ticketCount: data.ticketCount,
    ...(data.couponCode
      ? {
          couponCode: data.couponCode.trim().toUpperCase(),
        }
      : {}),
  });

  return response.data;
};

export const getEventPromotions = async (
  eventId: string
): Promise<EventPromotionsResponse> => {
  const response = await api.get(
    `/events/${eventId}/promotions`
  );

  return response.data;
};
