import { expressjwt } from "express-jwt";

const authJWT = () => {
  return expressjwt({
    secret: "Malaria",
    algorithms: ["HS256"],
  }).unless({
    path: ["/Malaria/User/login", "/Malaria/Hospital/all"],
  });
};

export default authJWT;
