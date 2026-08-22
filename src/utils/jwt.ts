import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  schoolId: string;
}



export interface RefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (
  payload: AccessTokenPayload
) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
};

export const generateRefreshToken = (
  payload: RefreshTokenPayload
) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};


export const verifyRefreshToken = (
  token: string
): RefreshTokenPayload => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET!
  ) as RefreshTokenPayload;
};


export const verifyAccessToken = (
  token:string
): AccessTokenPayload => {
    return jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as AccessTokenPayload;
}