import argon2 from "argon2"
import jwt, { JsonWebTokenError } from "jsonwebtoken"
import type { Request, Response } from "express"
import {pool} from "../config/database.js"
import { randomUUID } from "node:crypto";
import config from "../config/config.js";

interface User{
    username: string;
    email: string;
    password: string;
}

export async function register(req: Request, res: Response) : Promise<void> {

    try{

        const data : User = req.body;
        console.log(req.body);

        const username = data.username;
        const email = data.email;
        const password = data.password;

        const user = await pool.query("select id from users where email=$1", [email]);
        
        if(user.rows.length > 0){
            res.status(409).json({
                message: "USER ALREADY EXISTS"
            })

            return;
        }

        const hashedPassword = await argon2.hash(password);

        await pool.query("insert into users (username, email, password) values ($1,$2,$3)", [username, email, hashedPassword]);

        res.status(201).json({
            message: "USER REGISTERED"
        })

    } catch(error){

        const errorMessage = error instanceof Error ? error.message : String(error);

        console.log(errorMessage);

        if(errorMessage == 'duplicate key value violates unique constraint "users_username_key"'){
            res.status(409).json({
                message: "Username already exists"
            })

            return;

        } else{
            res.status(500).json({
                message: "Unexpected server-side failure"
            })
        }

        
    }
    
}


export async function login(req: Request, res:Response) : Promise<void>{
    try{
        const data = req.body;

        const email = data.email;
        const password = data.password;

        const userRow = await pool.query("select *from users where email=$1",[email]);

        if(userRow.rows.length == 0){
            res.status(401).json({
                message: "USER NOT REGISTERED"
            })

            return;
        }


        const verify = await argon2.verify(userRow.rows[0].password, password);

        if(!verify){
            res.status(401).json({
                message: "WRONG PASSWORD"
            })

            return;
        }

        const userId = userRow.rows[0].id;

        const sessionId = randomUUID();

        const refreshToken = jwt.sign(
        {
            userId,
            sessionId
        },
        config.JWT_SECRET,
        {
            expiresIn: "7d"
        });


        const refreshTokenHash = await argon2.hash(refreshToken);

        await pool.query("insert into sessions (id, userId, refreshTokenHash, expiresAt, ipAddress, userAgent) values ($1, $2, $3, NOW() + interval '7 days', $4, $5)",[sessionId, userId, refreshTokenHash, req.ip, req.get("user-agent")]);


        const accessToken = jwt.sign(
        {
            userId
        },
        config.JWT_SECRET,
        {
            expiresIn: "15m"
        });


        res.cookie("refreshToken", refreshToken,{
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7*24*60*60*1000
        });


        res.status(200).json({
            message: "USER LOGIN",
            accessToken
        })


    } catch(error){

        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(errorMessage);

        res.status(500).json({
            message: "Unexpected server-side failure"
        })
    }
}

interface refreshTokenPayload{
    userId: string;
    sessionId: string;
}

export async function refresh(req: Request, res:Response): Promise<void>{
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        res.status(401).json({
            message: "SESSION EXPIRED"
        })

        return;
    }


    try{
        
        const payload = jwt.verify(refreshToken, config.JWT_SECRET) as refreshTokenPayload;

        const {userId, sessionId} = payload;

        const result = await pool.query("select *from sessions where id=$1 and expiresAt > NOW() and revoked=false", [sessionId]);

        if(result.rows.length === 0){

            await pool.query("update sessions set revoked=true where id=$1", [sessionId]);
            
            res.clearCookie("refreshToken");

            res.status(401).json({
                message: "SESSION EXPIRED"
            })

            return;
        }


        const accessToken = jwt.sign(
            {
                userId
            },
            config.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        )


        res.status(200).json({
            message: "REFRESHED",
            accessToken
        })


    } catch(error){

        if(error instanceof jwt.TokenExpiredError){
            res.status(401).json({
                message: "TOKEN EXPIRED"
            })

            return;
        }

        if(error instanceof jwt.JsonWebTokenError){
            res.status(401).json({
                message: "INVALID REFRESH TOKEN"
            })

            return;
        }


        
        const errorMessage = error instanceof Error ? error.message : String(error);

        console.log(errorMessage);

        res.status(500).json({
            message: errorMessage
        })

        return;
    }
}


export async function logout(req: Request, res: Response): Promise<void>{
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        res.status(401).json({
            message: "SESSION EXPIRED"
        })

        return;
    }

    try{

        const payload = jwt.verify(refreshToken,config.JWT_SECRET) as refreshTokenPayload;

        const {userId, sessionId} = payload;

        await pool.query("update sessions set revoked=true where id=$1",[sessionId]);

        res.clearCookie("refreshToken");

        res.status(200).json({
            message: "LOGGED OUT OF THIS DEVICE"
        })

        return;
    } catch(error){

        res.clearCookie("refreshToken");

        if(error instanceof jwt.TokenExpiredError){
            res.status(401).json({
                message: "SESSION EXPIRED"
            })

            return;
        }

        if(error instanceof jwt.JsonWebTokenError){
            res.status(401).json({
                message: "INVALID TOKEN"
            })

            return;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);

        console.log(errorMessage);

        res.status(500).json({
            message: errorMessage
        })

        return;

    }
}


export async function logoutAll(req: Request, res: Response): Promise<void>{
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        res.status(401).json({
            message: "SESSION EXPIRED"
        })

        return;
    }

    try{

        const payload = jwt.verify(refreshToken,config.JWT_SECRET) as refreshTokenPayload;

        const {userId, sessionId} = payload;

        await pool.query("update sessions set revoked=true where id=$1",[sessionId]);

        await pool.query("update sessions set revoked=true where userId=$1 and revoked=false", [userId]);
        
        res.clearCookie("refreshToken");

        res.status(200).json({
            message: "LOGGED OUT FROM ALL THE DEVICES"
        })

        return;
    } catch(error){

        res.clearCookie("refreshToken");

        if(error instanceof jwt.TokenExpiredError){
            res.status(401).json({
                message: "SESSION EXPIRED"
            })

            return;
        }

        if(error instanceof jwt.JsonWebTokenError){
            res.status(401).json({
                message: "INVALID TOKEN"
            })

            return;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);

        console.log(errorMessage);

        res.status(500).json({
            message: errorMessage
        })

        return;

    }
}