import { NextRequest } from "next/server";
import * as jose from "jose";

export async function getUser(request: NextRequest) {
    
    const loginToken = request.cookies.get("loginToken")?.value; // Retrieve the login token from the request cookies

    const secretText = process.env.JOSE_SECRET; // Retrieve the secret text from environment variables

    const secret = new TextEncoder().encode(secretText); // Encode the secret text as a Uint8Array

    try {

        const user = await jose.jwtVerify(

            loginToken||"",  
            secret
            
        ) // Verify the JWT using the secret

        return user.payload; // Return the payload of the verified JWT, which contains user information
    }
    catch {

        return null; // If verification fails, return null indicating that the user is not authenticated

    }

}