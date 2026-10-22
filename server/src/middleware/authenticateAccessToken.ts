import { NextFunction, Request, Response} from "express";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import config from "../config/config.js"

export interface accessTokenPayload{
    userId: string;
}

function authenticateAccessToken(req: Request, res: Response, next: NextFunction) : void {

    const authorization = req.headers.authorization;

    if(!authorization){
        res.status(401).json({
            message: "ACCESS_TOKEN_REQUIRED"
        })

        return;
    }



    const [scheme, token] = authorization.split(" ");

    if(scheme !== "Bearer" || !token){
        res.status(401).json({
            message: "INVALID_AUTHORIZATION_HEADER"
        });

        return;
    }


    try{

        const payload = jwt.verify(token, config.JWT_SECRET) as accessTokenPayload;

        req.user = payload;

        next();
    }

    catch(error){
        if(error instanceof jwt.TokenExpiredError){
            res.status(401).json({
                message: "ACCESS_TOKEN_EXPIRED"
            })

            return;
        }

        if(error instanceof jwt.JsonWebTokenError){
            res.status(401).json({
                message: "INVALID_ACCESS_TOKEN"
            })


            return;
        }


        res.status(500).json({
            message: "INVALID_SERVER_ERROR"
        })

        return;

    }
}


export default authenticateAccessToken;