import axios from "axios";

export const validateCodeforcesHandle = async (
    handle: string
  ): Promise<boolean> => {
    try {
      const response = await axios.get(
        `https://codeforces.com/api/user.info?handles=${handle}`
      );
      return response.data.status === "OK";
    } catch (error) {
      console.error(`Error validating handle ${handle}:`, error);
      return false;
    }
  };
  