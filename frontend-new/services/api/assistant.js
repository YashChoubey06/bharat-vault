import apiClient from "./client";

export async function askAssistant({parcelId, question}) {
  if (!parcelId) throw new Error("Open a parcel record to ask about its evidence.");
  const response = await apiClient.post(
    "/assistant/query",
    {
      parcelId,
      question,
    }
  );

  return response.data;
}
