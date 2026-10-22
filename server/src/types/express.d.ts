import { accessTokenPayload } from "../middleware/authenticateAccessToken.tsx";


declare global{
    namespace Express{
        interface Request{
            user?: accessTokenPayload
        }
    }
}

export {};