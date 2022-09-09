import axios from "axios";
export const Preview = async (req, res) => {
  const response = await axios.get(
    "https://ghoapi.azureedge.net/api/Indicator?$filter=contains(IndicatorName,'malaria case')"
  );
  console.log(response.data);
};
