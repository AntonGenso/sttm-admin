import axios from "axios";

const BASE_URL = "/api/missions";

export const getMissions = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}`);
    return data;
  } catch (error) {
    console.error(error);
  }
};

export const createMission = async (missionName: string) => {
  try {
    const { data } = await axios.post(`${BASE_URL}?missionName=${missionName}`);
    return data;
  } catch (error) {
    console.error(error);
  }
};
